import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { Role } from '../../entities/role.entity';
import { Organization } from '../../entities/organization.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
    @InjectRepository(Organization)
    private organizationsRepository: Repository<Organization>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Verify role exists
    const role = await this.rolesRepository.findOne({
      where: { id: createUserDto.roleId },
    });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Verify organization exists if provided
    if (createUserDto.organizationId) {
      const organization = await this.organizationsRepository.findOne({
        where: { id: createUserDto.organizationId },
      });
      if (!organization) {
        throw new NotFoundException('Organization not found');
      }
    }

    const user = this.usersRepository.create(createUserDto);
    return this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      relations: ['role', 'organization'],
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        isEmailVerified: true,
        phone: true,
        avatar: true,
        walletAddress: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['role', 'organization'],
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        isEmailVerified: true,
        phone: true,
        avatar: true,
        walletAddress: true,
        roleId: true,
        organizationId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User> {
    return this.usersRepository.findOne({
      where: { email },
      relations: ['role', 'organization'],
    });
  }

  async findByWalletAddress(walletAddress: string): Promise<User> {
    return this.usersRepository.findOne({
      where: { walletAddress },
      relations: ['role', 'organization'],
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);

    // Verify role exists if being updated
    if (updateUserDto.roleId) {
      const role = await this.rolesRepository.findOne({
        where: { id: updateUserDto.roleId },
      });
      if (!role) {
        throw new NotFoundException('Role not found');
      }
    }

    // Verify organization exists if being updated
    if (updateUserDto.organizationId) {
      const organization = await this.organizationsRepository.findOne({
        where: { id: updateUserDto.organizationId },
      });
      if (!organization) {
        throw new NotFoundException('Organization not found');
      }
    }

    await this.usersRepository.update(id, updateUserDto);
    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findById(id);
    await this.usersRepository.remove(user);
  }

  async deactivate(id: string): Promise<User> {
    await this.usersRepository.update(id, { isActive: false });
    return this.findById(id);
  }

  async activate(id: string): Promise<User> {
    await this.usersRepository.update(id, { isActive: true });
    return this.findById(id);
  }
}
