import { Command, CommandRunner } from 'nest-commander';
import { UserSeeder } from './user.seeder';
import { Injectable } from '@nestjs/common';

@Command({
  name: 'seed',
  description: 'Seed the database with initial data',
  options: { isDefault: true }
})
@Injectable()
export class SeedCommand extends CommandRunner {
  constructor(private readonly userSeeder: UserSeeder) {
    super();
  }

  async run(passedParams: string[], options?: Record<string, any>): Promise<void> {
    try {
      console.log('Starting database seeding...');
      await this.userSeeder.seed();
      console.log('✅ Database seeded successfully!');
    } catch (error) {
      console.error('❌ Error seeding database:', error);
      throw error;
    }
  }
}
