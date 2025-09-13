import { PartialType } from '@nestjs/swagger';
import { CreateMonitoringEventDto } from './create-monitoring-event.dto';

export class UpdateMonitoringEventDto extends PartialType(CreateMonitoringEventDto) {}
