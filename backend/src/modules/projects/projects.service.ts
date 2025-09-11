import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../../entities/project.entity';
import { Organization } from '../../entities/organization.entity';
import { User } from '../../entities/user.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectStatus, UserRole } from '../../common/enums/user-role.enum';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    @InjectRepository(Organization)
    private organizationsRepository: Repository<Organization>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createProjectDto: CreateProjectDto, userId: string): Promise<Project> {
    // Verify organization exists
    const organization = await this.organizationsRepository.findOne({
      where: { id: createProjectDto.organizationId },
    });
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const project = this.projectsRepository.create({
      ...createProjectDto,
      createdById: userId,
      status: ProjectStatus.DRAFT,
    });

    return this.projectsRepository.save(project);
  }

  async findAll(userId?: string, userRole?: UserRole): Promise<Project[]> {
    const queryBuilder = this.projectsRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.organization', 'organization')
      .leftJoinAndSelect('project.createdBy', 'createdBy')
      .leftJoinAndSelect('project.approvedBy', 'approvedBy')
      .leftJoinAndSelect('project.plots', 'plots')
      .leftJoinAndSelect('project.credits', 'credits');

    // Apply role-based filtering
    if (userRole === UserRole.DEVELOPER && userId) {
      queryBuilder.where('project.createdById = :userId', { userId });
    } else if (userRole === UserRole.PUBLIC) {
      queryBuilder.where('project.status IN (:...statuses)', {
        statuses: [ProjectStatus.ACTIVE, ProjectStatus.COMPLETED],
      });
    }

    return queryBuilder.getMany();
  }

  async findById(id: string, userId?: string, userRole?: UserRole): Promise<Project> {
    const queryBuilder = this.projectsRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.organization', 'organization')
      .leftJoinAndSelect('project.createdBy', 'createdBy')
      .leftJoinAndSelect('project.approvedBy', 'approvedBy')
      .leftJoinAndSelect('project.plots', 'plots')
      .leftJoinAndSelect('project.credits', 'credits')
      .where('project.id = :id', { id });

    const project = await queryBuilder.getOne();

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Apply role-based access control
    if (userRole === UserRole.DEVELOPER && project.createdById !== userId) {
      throw new ForbiddenException('Access denied to this project');
    }

    if (userRole === UserRole.PUBLIC && 
        ![ProjectStatus.ACTIVE, ProjectStatus.COMPLETED].includes(project.status)) {
      throw new ForbiddenException('Project not publicly accessible');
    }

    return project;
  }

  async findByOrganization(organizationId: string): Promise<Project[]> {
    return this.projectsRepository.find({
      where: { organizationId },
      relations: ['organization', 'createdBy', 'approvedBy', 'plots', 'credits'],
    });
  }

  async findByStatus(status: ProjectStatus): Promise<Project[]> {
    return this.projectsRepository.find({
      where: { status },
      relations: ['organization', 'createdBy', 'approvedBy', 'plots', 'credits'],
    });
  }

  async update(id: string, updateProjectDto: UpdateProjectDto, userId: string, userRole: UserRole): Promise<Project> {
    const project = await this.findById(id);

    // Only creators can update their projects (unless admin/auditor)
    if (userRole === UserRole.DEVELOPER && project.createdById !== userId) {
      throw new ForbiddenException('You can only update your own projects');
    }

    // Prevent status changes by developers
    if (userRole === UserRole.DEVELOPER && updateProjectDto.status) {
      delete updateProjectDto.status;
    }

    await this.projectsRepository.update(id, updateProjectDto);
    return this.findById(id);
  }

  async updateStatus(id: string, status: ProjectStatus, userId: string): Promise<Project> {
    const project = await this.findById(id);

    const updateData: any = { status };

    // Set approval data for approved status
    if (status === ProjectStatus.APPROVED) {
      updateData.approvedById = userId;
      updateData.approvedAt = new Date();
    }

    await this.projectsRepository.update(id, updateData);
    return this.findById(id);
  }

  async submit(id: string, userId: string): Promise<Project> {
    const project = await this.findById(id);

    if (project.createdById !== userId) {
      throw new ForbiddenException('You can only submit your own projects');
    }

    if (project.status !== ProjectStatus.DRAFT) {
      throw new ForbiddenException('Only draft projects can be submitted');
    }

    return this.updateStatus(id, ProjectStatus.SUBMITTED, userId);
  }

  async approve(id: string, userId: string): Promise<Project> {
    return this.updateStatus(id, ProjectStatus.APPROVED, userId);
  }

  async reject(id: string, userId: string): Promise<Project> {
    return this.updateStatus(id, ProjectStatus.REJECTED, userId);
  }

  async activate(id: string, userId: string): Promise<Project> {
    return this.updateStatus(id, ProjectStatus.ACTIVE, userId);
  }

  async complete(id: string, userId: string): Promise<Project> {
    return this.updateStatus(id, ProjectStatus.COMPLETED, userId);
  }

  async suspend(id: string, userId: string): Promise<Project> {
    return this.updateStatus(id, ProjectStatus.SUSPENDED, userId);
  }

  async remove(id: string, userId: string, userRole: UserRole): Promise<void> {
    const project = await this.findById(id);

    // Only creators can delete their projects (unless admin)
    if (userRole === UserRole.DEVELOPER && project.createdById !== userId) {
      throw new ForbiddenException('You can only delete your own projects');
    }

    // Prevent deletion of active projects
    if ([ProjectStatus.ACTIVE, ProjectStatus.COMPLETED].includes(project.status)) {
      throw new ForbiddenException('Cannot delete active or completed projects');
    }

    await this.projectsRepository.remove(project);
  }
}
