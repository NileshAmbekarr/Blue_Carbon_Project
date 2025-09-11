import { PartialType } from '@nestjs/swagger';
import { CreateFileMetadataDto } from './create-file-metadata.dto';
import { IsOptional, IsBoolean, IsString, IsDateString, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateFileMetadataDto extends PartialType(CreateFileMetadataDto) {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isProcessed?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;

  @ApiPropertyOptional({ example: 'user-uuid' })
  @IsOptional()
  @IsString()
  verifiedBy?: string;

  @ApiPropertyOptional({ example: '2024-01-15T10:30:00Z' })
  @IsOptional()
  @IsDateString()
  verifiedAt?: Date;

  @ApiPropertyOptional({ example: { analysis: 'completed', confidence: 0.95 } })
  @IsOptional()
  @IsObject()
  processingResults?: any;
}
