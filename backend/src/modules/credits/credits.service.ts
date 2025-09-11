import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Credit } from '../../entities/credit.entity';
import { Project } from '../../entities/project.entity';
import { CreateCreditDto } from './dto/create-credit.dto';
import { UpdateCreditDto } from './dto/update-credit.dto';
import { CreditStatus, UserRole } from '../../common/enums/user-role.enum';

@Injectable()
export class CreditsService {
  constructor(
    @InjectRepository(Credit)
    private creditsRepository: Repository<Credit>,
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
  ) {}

  async create(createCreditDto: CreateCreditDto): Promise<Credit> {
    // Verify project exists
    const project = await this.projectsRepository.findOne({
      where: { id: createCreditDto.projectId },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Generate batch ID if not provided
    if (!createCreditDto.batchId) {
      createCreditDto.batchId = this.generateBatchId(project.id);
    }

    const credit = this.creditsRepository.create({
      ...createCreditDto,
      status: CreditStatus.PENDING,
    });

    return this.creditsRepository.save(credit);
  }

  async findAll(userRole?: UserRole): Promise<Credit[]> {
    const queryBuilder = this.creditsRepository
      .createQueryBuilder('credit')
      .leftJoinAndSelect('credit.project', 'project')
      .leftJoinAndSelect('project.organization', 'organization');

    // Public users can only see issued/retired credits
    if (userRole === UserRole.PUBLIC) {
      queryBuilder.where('credit.status IN (:...statuses)', {
        statuses: [CreditStatus.ISSUED, CreditStatus.RETIRED],
      });
    }

    return queryBuilder.getMany();
  }

  async findById(id: string): Promise<Credit> {
    const credit = await this.creditsRepository.findOne({
      where: { id },
      relations: ['project', 'project.organization'],
    });

    if (!credit) {
      throw new NotFoundException('Credit not found');
    }

    return credit;
  }

  async findByProject(projectId: string): Promise<Credit[]> {
    return this.creditsRepository.find({
      where: { projectId },
      relations: ['project'],
    });
  }

  async findByStatus(status: CreditStatus): Promise<Credit[]> {
    return this.creditsRepository.find({
      where: { status },
      relations: ['project', 'project.organization'],
    });
  }

  async findByBatchId(batchId: string): Promise<Credit[]> {
    return this.creditsRepository.find({
      where: { batchId },
      relations: ['project', 'project.organization'],
    });
  }

  async update(id: string, updateCreditDto: UpdateCreditDto): Promise<Credit> {
    await this.creditsRepository.update(id, updateCreditDto);
    return this.findById(id);
  }

  async issue(id: string, walletAddress: string, txHash: string): Promise<Credit> {
    const credit = await this.findById(id);

    if (credit.status !== CreditStatus.PENDING) {
      throw new ForbiddenException('Only pending credits can be issued');
    }

    const updateData = {
      status: CreditStatus.ISSUED,
      issuedToWallet: walletAddress,
      blockchainTxHash: txHash,
      issuedAt: new Date(),
      serialNumber: this.generateSerialNumber(credit.batchId),
    };

    await this.creditsRepository.update(id, updateData);
    return this.findById(id);
  }

  async retire(id: string, walletAddress: string, reason: string, txHash: string): Promise<Credit> {
    const credit = await this.findById(id);

    if (credit.status !== CreditStatus.ISSUED) {
      throw new ForbiddenException('Only issued credits can be retired');
    }

    const updateData = {
      status: CreditStatus.RETIRED,
      retiredByWallet: walletAddress,
      retirementReason: reason,
      blockchainTxHash: txHash,
      retiredAt: new Date(),
    };

    await this.creditsRepository.update(id, updateData);
    return this.findById(id);
  }

  async revoke(id: string, txHash: string): Promise<Credit> {
    const credit = await this.findById(id);

    if (![CreditStatus.ISSUED, CreditStatus.PENDING].includes(credit.status)) {
      throw new ForbiddenException('Cannot revoke retired credits');
    }

    const updateData = {
      status: CreditStatus.REVOKED,
      blockchainTxHash: txHash,
      revokedAt: new Date(),
    };

    await this.creditsRepository.update(id, updateData);
    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    const credit = await this.findById(id);

    // Only allow deletion of pending credits
    if (credit.status !== CreditStatus.PENDING) {
      throw new ForbiddenException('Cannot delete issued, retired, or revoked credits');
    }

    await this.creditsRepository.remove(credit);
  }

  async getTotalCreditsByProject(projectId: string): Promise<{
    total: number;
    issued: number;
    retired: number;
    pending: number;
    revoked: number;
  }> {
    const credits = await this.findByProject(projectId);
    
    return {
      total: credits.reduce((sum, credit) => sum + Number(credit.amountTCO2e), 0),
      issued: credits
        .filter(c => c.status === CreditStatus.ISSUED)
        .reduce((sum, credit) => sum + Number(credit.amountTCO2e), 0),
      retired: credits
        .filter(c => c.status === CreditStatus.RETIRED)
        .reduce((sum, credit) => sum + Number(credit.amountTCO2e), 0),
      pending: credits
        .filter(c => c.status === CreditStatus.PENDING)
        .reduce((sum, credit) => sum + Number(credit.amountTCO2e), 0),
      revoked: credits
        .filter(c => c.status === CreditStatus.REVOKED)
        .reduce((sum, credit) => sum + Number(credit.amountTCO2e), 0),
    };
  }

  private generateBatchId(projectId: string): string {
    const timestamp = Date.now();
    const projectPrefix = projectId.substring(0, 8).toUpperCase();
    return `BC-${projectPrefix}-${timestamp}`;
  }

  private generateSerialNumber(batchId: string): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${batchId}-${random}`;
  }
}
