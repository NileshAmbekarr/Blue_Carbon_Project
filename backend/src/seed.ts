import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UserSeeder } from './database/seeders/user.seeder';
import { SeederModule } from './database/seeders/seeder.module';

async function bootstrap() {
  console.log('Starting seed script...');
  
  try {
    const app = await NestFactory.createApplicationContext({
      module: AppModule,
      bufferLogs: true,
    });

    console.log('Application context created, running seeders...');
    
    const userSeeder = app.get(UserSeeder);
    await userSeeder.seed();
    
    console.log('Seed completed successfully!');
    await app.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

bootstrap();