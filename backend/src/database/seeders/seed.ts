import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { UserSeeder } from './user.seeder';
import { Logger } from '@nestjs/common';

const logger = new Logger('DatabaseSeeder');

async function bootstrap() {
  try {
    logger.log('Starting database seeding...');
    
    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: ['error', 'warn', 'log'],
    });
    
    const userSeeder = app.get(UserSeeder);
    await userSeeder.seed();
    
    logger.log('Database seeding completed successfully!');
    await app.close();
    process.exit(0);
  } catch (error) {
    logger.error('Error during database seeding:', error);
    process.exit(1);
  }
}

bootstrap();
