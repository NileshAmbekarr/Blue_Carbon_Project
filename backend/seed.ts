import { CommandFactory } from 'nest-commander';
import { AppModule } from './src/app.module';
import { SeedCommand } from './src/database/seeders/seed.command';

async function bootstrap() {
  await CommandFactory.run(SeedCommand);
  process.exit(0);
}

bootstrap().catch(err => {
  console.error('❌ Error running seed command:', err);
  process.exit(1);
});