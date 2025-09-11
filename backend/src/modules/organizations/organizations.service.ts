import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../../entities/organization.entity';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private organizationsRepository: Repository<Organization>,
  ) {}

  async create(createOrganizationDto: CreateOrganizationDto): Promise<Organization> {
    const organization = this.organizationsRepository.create(createOrganizationDto);
    return this.organizationsRepository.save(organization);
  }

  async findAll(): Promise<Organization[]> {
    return this.organizationsRepository.find({
      relations: ['users', 'projects'],
    });
  }

  async findById(id: string): Promise<Organization> {
    const organization = await this.organizationsRepository.findOne({
      where: { id },
      relations: ['users', 'projects'],
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }

  async findByType(type: string): Promise<Organization[]> {
    return this.organizationsRepository.find({
      where: { type: type as any },
      relations: ['users', 'projects'],
    });
  }

  async update(id: string, updateOrganizationDto: UpdateOrganizationDto): Promise<Organization> {
    await this.organizationsRepository.update(id, updateOrganizationDto);
    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    const organization = await this.findById(id);
    await this.organizationsRepository.remove(organization);
  }

  async updateKycStatus(id: string, kycStatus: boolean): Promise<Organization> {
    await this.organizationsRepository.update(id, { kycStatus });
    return this.findById(id);
  }

  async deactivate(id: string): Promise<Organization> {
    await this.organizationsRepository.update(id, { isActive: false });
    return this.findById(id);
  }

  async activate(id: string): Promise<Organization> {
    await this.organizationsRepository.update(id, { isActive: true });
    return this.findById(id);
  }
}
