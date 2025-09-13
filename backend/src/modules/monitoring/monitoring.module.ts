import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MonitoringController } from './monitoring.controller';
import { MonitoringService } from './monitoring.service';
import { MonitoringEvent, MonitoringEventSchema } from '../../schemas/monitoring-event.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MonitoringEvent.name, schema: MonitoringEventSchema }
    ])
  ],
  controllers: [MonitoringController],
  providers: [MonitoringService],
  exports: [MonitoringService],
})
export class MonitoringModule {}
