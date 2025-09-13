import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../../entities/user.entity';
import { Organization } from '../../entities/organization.entity';
import { UserRole, OrganizationType } from '../../common/enums/user-role.enum';

@Injectable()
export class UserSeeder {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
  ) {}

  async seed() {
    // Check if users already exist
    const existingUsers = await this.userRepository.count();
    if (existingUsers > 0) {
      console.log('Users already exist, skipping seeding');
      return;
    }

    // Create organizations first
    const nccr = await this.organizationRepository.save({
      name: 'National Carbon Credit Registry (NCCR)',
      type: OrganizationType.GOVERNMENT,
      description: 'Government body managing carbon credit registry',
      contactEmail: 'admin@nccr.gov.in',
      contactPhone: '+91-11-12345678',
      address: 'New Delhi, India',
      isVerified: true,
    });

    const ngo = await this.organizationRepository.save({
      name: 'Green Earth Foundation',
      type: OrganizationType.NGO,
      description: 'Environmental NGO working on mangrove restoration',
      contactEmail: 'contact@greenearth.org',
      contactPhone: '+91-22-87654321',
      address: 'Mumbai, Maharashtra',
      isVerified: true,
    });

    const panchayat = await this.organizationRepository.save({
      name: 'Coastal Village Panchayat',
      type: OrganizationType.PANCHAYAT,
      description: 'Local governance body managing coastal restoration',
      contactEmail: 'sarpanch@coastalvillage.gov.in',
      contactPhone: '+91-832-9876543',
      address: 'Goa, India',
      isVerified: true,
    });

    const auditor = await this.organizationRepository.save({
      name: 'Carbon Verification Services',
      type: OrganizationType.PRIVATE,
      description: 'Third-party carbon credit verification company',
      contactEmail: 'verify@carbonservices.com',
      contactPhone: '+91-80-5555555',
      address: 'Bangalore, Karnataka',
      isVerified: true,
    });

    // Create sample users
    const users = [
      {
        email: 'admin@nccr.gov.in',
        password: await bcrypt.hash('Admin@123', 10),
        name: 'NCCR Administrator',
        roleId: '1', 
        organizationId: nccr.id,
        isActive: true,
        isEmailVerified: true,
        walletAddress: null,
      },
      {
        email: 'auditor@carbonservices.com',
        password: await bcrypt.hash('Auditor@123', 10),
        name: 'Carbon Auditor',
        roleId: '2', 
        organizationId: auditor.id,
        isActive: true,
        isEmailVerified: true,
        walletAddress: null,
      },
      {
        email: 'developer@greenearth.org',
        password: await bcrypt.hash('Developer@123', 10),
        name: 'NGO Developer',
        roleId: '3', 
        organizationId: ngo.id,
        isActive: true,
        isEmailVerified: true,
        walletAddress: null,
      },
      {
        email: 'panchayat@coastalvillage.gov.in',
        password: await bcrypt.hash('Panchayat@123', 10),
        name: 'Village Sarpanch',
        roleId: '3', 
        organizationId: panchayat.id,
        isActive: true,
        isEmailVerified: true,
        walletAddress: null,
      },
      {
        email: 'public@example.com',
        password: await bcrypt.hash('Public@123', 10),
        name: 'Public User',
        roleId: '4', 
        organizationId: null,
        isActive: true,
        isEmailVerified: true,
        walletAddress: null,
      },
    ];

    await this.userRepository.save(users);

    console.log('Sample users created successfully:');
    console.log('Admin: admin@nccr.gov.in / Admin@123');
    console.log('Auditor: auditor@carbonservices.com / Auditor@123');
    console.log('NGO Developer: developer@greenearth.org / Developer@123');
    console.log('Panchayat Developer: panchayat@coastalvillage.gov.in / Panchayat@123');
    console.log('Public User: public@example.com / Public@123');
  }
}
