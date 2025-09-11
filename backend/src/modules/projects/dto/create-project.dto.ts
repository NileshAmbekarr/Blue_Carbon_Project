import { IsString, IsNotEmpty, IsOptional, IsUUID, IsDecimal, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateProjectDto {
  @ApiProperty({ example: 'Mangrove Restoration Project' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Restoring 100 hectares of mangrove forest' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'VCS-VM0007' })
  @IsOptional()
  @IsString()
  methodology?: string;

  @ApiPropertyOptional({ example: 10.5 })
  @IsOptional()
  @IsDecimal()
  @Transform(({ value }) => parseFloat(value))
  bufferPercentage?: number;

  @ApiPropertyOptional({ example: 'baseline-documents-json' })
  @IsOptional()
  @IsString()
  baselineDocuments?: string;

  @ApiPropertyOptional({ example: 1000.50 })
  @IsOptional()
  @IsDecimal()
  @Transform(({ value }) => parseFloat(value))
  estimatedCredits?: number;

  @ApiPropertyOptional({ example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  projectPeriodStart?: string;

  @ApiPropertyOptional({ example: '2034-01-01' })
  @IsOptional()
  @IsDateString()
  projectPeriodEnd?: string;

  @ApiProperty({ example: 'organization-uuid' })
  @IsUUID()
  @IsNotEmpty()
  organizationId: string;
}
