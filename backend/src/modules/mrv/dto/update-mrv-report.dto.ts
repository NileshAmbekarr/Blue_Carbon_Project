import { PartialType } from '@nestjs/swagger';
import { CreateMrvReportDto } from './create-mrv-report.dto';
import { IsOptional, IsString, IsDateString, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMrvReportDto extends PartialType(CreateMrvReportDto) {
  @ApiPropertyOptional({ example: 'verified' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 'user-uuid' })
  @IsOptional()
  @IsString()
  verifiedBy?: string;

  @ApiPropertyOptional({ example: '2024-01-15T10:30:00Z' })
  @IsOptional()
  @IsDateString()
  verifiedAt?: Date;

  @ApiPropertyOptional({ example: 'Insufficient data quality' })
  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @ApiPropertyOptional({ example: '2024-01-15T10:30:00Z' })
  @IsOptional()
  @IsDateString()
  processedAt?: Date;

  @ApiPropertyOptional({ example: { analysis: 'completed', confidence: 0.95 } })
  @IsOptional()
  @IsObject()
  results?: any;
}
