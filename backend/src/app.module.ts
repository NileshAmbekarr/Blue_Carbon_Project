import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseConfig } from './config/database.config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { PlotsModule } from './modules/plots/plots.module';
import { CreditsModule } from './modules/credits/credits.module';
import { FilesModule } from './modules/files/files.module';
import { MrvModule } from './modules/mrv/mrv.module';
import { BlockchainModule } from './modules/blockchain/blockchain.module';
import { SeederModule } from './database/seeders/seeder.module';
import { SeedCommand } from './database/seeders/seed.command';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    // PostgreSQL with TypeORM
    TypeOrmModule.forRootAsync({
      useClass: DatabaseConfig,
    }),
    
    // MongoDB with Mongoose
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.MONGODB_URI,
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }),
    }),
    
    // Feature modules
    AuthModule,
    UsersModule,
    OrganizationsModule,
    ProjectsModule,
    PlotsModule,
    CreditsModule,
    FilesModule,
    MrvModule,
    BlockchainModule,
    SeederModule,
  ],
  controllers: [AppController],
  providers: [AppService, SeedCommand],
})
export class AppModule {}
