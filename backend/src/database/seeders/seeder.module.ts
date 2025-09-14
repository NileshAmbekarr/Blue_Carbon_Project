import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { Role } from '../../entities/role.entity';
import { Organization } from '../../entities/organization.entity';
import { UserSeeder } from './user.seeder';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Role,
      Organization
    ])
  ],
  providers: [UserSeeder],
  exports: [UserSeeder],
})
export class SeederModule {}
