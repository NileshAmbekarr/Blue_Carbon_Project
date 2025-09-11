import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MrvService } from './mrv.service';
import { MrvController } from './mrv.controller';
import { MrvReport, MrvReportSchema } from '../../schemas/mrv-report.schema';
import { MonitoringEvent, MonitoringEventSchema } from '../../schemas/monitoring-event.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MrvReport.name, schema: MrvReportSchema },
      { name: MonitoringEvent.name, schema: MonitoringEventSchema },
    ]),
  ],
  controllers: [MrvController],
  providers: [MrvService],
  exports: [MrvService],
})
export class MrvModule {}
