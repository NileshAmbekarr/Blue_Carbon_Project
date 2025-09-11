import { PartialType } from '@nestjs/swagger';
import { CreatePlotDto } from './create-plot.dto';

export class UpdatePlotDto extends PartialType(CreatePlotDto) {}
