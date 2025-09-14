import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../../entities/user.entity';
import { Role } from '../../entities/role.entity';
import { Organization } from '../../entities/organization.entity';
import { UserRole, OrganizationType } from '../../common/enums/user-role.enum';

@Injectable()
export class UserSeeder {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
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

    // Create roles if they don't exist
    const roles = [
      { name: UserRole.ADMIN, description: 'Administrator with full access' },
      { name: UserRole.AUDITOR, description: 'Auditor with verification access' },
      { name: UserRole.DEVELOPER, description: 'Project developer' },
      { name: UserRole.PUBLIC, description: 'Public user with read-only access' },
    ];

    const createdRoles: Record<string, Role> = {};
    for (const role of roles) {
      let existingRole = await this.roleRepository.findOne({ where: { name: role.name } });
      if (!existingRole) {
        existingRole = await this.roleRepository.save(role);
      }
      createdRoles[role.name] = existingRole;
    }

    // Create organizations
    const organizations = [
      {
        name: 'National Carbon Credit Registry (NCCR)',
        type: OrganizationType.GOVERNMENT,
        description: 'Government body managing carbon credit registry',
        contactEmail: 'admin@nccr.gov.in',
        contactPhone: '+91-11-12345678',
        address: 'New Delhi, India',
        isVerified: true,
      },
      {
        name: 'Green Earth Foundation',
        type: OrganizationType.NGO,
        description: 'Environmental NGO working on mangrove restoration',
        contactEmail: 'contact@greenearth.org',
        contactPhone: '+91-22-87654321',
        address: 'Mumbai, Maharashtra',
        isVerified: true,
      },
      {
        name: 'Coastal Village Panchayat',
        type: OrganizationType.PANCHAYAT,
        description: 'Local governance body managing coastal restoration',
        contactEmail: 'sarpanch@coastalvillage.gov.in',
        contactPhone: '+91-832-9876543',
        address: 'Goa, India',
        isVerified: true,
      },
      {
        name: 'Carbon Verification Services',
        type: OrganizationType.PRIVATE,
        description: 'Third-party carbon credit verification company',
        contactEmail: 'verify@carbonservices.com',
        contactPhone: '+91-80-5555555',
        address: 'Bangalore, Karnataka',
        isVerified: true,
      },
    ];

    const createdOrgs = await Promise.all(
      organizations.map(org => this.organizationRepository.save(org))
    );

    // Create users with proper relationship IDs
    const users = [
      {
        email: 'admin@nccr.gov.in',
        password: await bcrypt.hash('Admin@123', 10),
        name: 'NCCR Administrator',
        roleId: createdRoles[UserRole.ADMIN].id,
        organizationId: createdOrgs[0].id,
        isActive: true,
        isEmailVerified: true,
      },
      {
        email: 'auditor@carbonservices.com',
        password: await bcrypt.hash('Auditor@123', 10),
        name: 'Carbon Auditor',
        roleId: createdRoles[UserRole.AUDITOR].id,
        organizationId: createdOrgs[3].id,
        isActive: true,
        isEmailVerified: true,
      },
      {
        email: 'developer@greenearth.org',
        password: await bcrypt.hash('Developer@123', 10),
        name: 'NGO Developer',
        roleId: createdRoles[UserRole.DEVELOPER].id,
        organizationId: createdOrgs[1].id,
        isActive: true,
        isEmailVerified: true,
      },
      {
        email: 'panchayat@coastalvillage.gov.in',
        password: await bcrypt.hash('Panchayat@123', 10),
        name: 'Village Sarpanch',
        roleId: createdRoles[UserRole.DEVELOPER].id,
        organizationId: createdOrgs[2].id,
        isActive: true,
        isEmailVerified: true,
      },
      {
        email: 'public@example.com',
        password: await bcrypt.hash('Public@123', 10),
        name: 'Public User',
        roleId: createdRoles[UserRole.PUBLIC].id,
        organizationId: null,
        isActive: true,
        isEmailVerified: true,
      },
    ];

    await this.userRepository.save(users);

    console.log('\n✅ Database seeded successfully!');
    console.log('\nSample users created:');
    console.log('-------------------');
    console.log('Admin: admin@nccr.gov.in / Admin@123');
    console.log('Auditor: auditor@carbonservices.com / Auditor@123');
    console.log('NGO Developer: developer@greenearth.org / Developer@123');
    console.log('Panchayat: panchayat@coastalvillage.gov.in / Panchayat@123');
    console.log('Public User: public@example.com / Public@123\n');
  }
}
