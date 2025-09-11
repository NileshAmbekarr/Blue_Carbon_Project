import { IsString, IsNotEmpty, IsOptional, IsUUID, IsEnum, IsNumber, IsObject, IsDateString, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FileType } from '../../../common/enums/user-role.enum';

export class CreateFileMetadataDto {
  @ApiProperty({ example: 'project-uuid' })
  @IsUUID()
  @IsNotEmpty()
  projectId: string;

  @ApiProperty({ example: 'plot-uuid' })
  @IsUUID()
  @IsNotEmpty()
  plotId: string;

  @ApiProperty({ enum: FileType, example: FileType.PHOTO })
  @IsEnum(FileType)
  @IsNotEmpty()
  fileType: FileType;

  @ApiPropertyOptional({ example: 'field-photo-001.jpg' })
  @IsOptional()
  @IsString()
  originalName?: string;

  @ApiPropertyOptional({ example: '1699123456-field-photo-001.jpg' })
  @IsOptional()
  @IsString()
  fileName?: string;

  @ApiPropertyOptional({ example: 'image/jpeg' })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiPropertyOptional({ example: 2048576 })
  @IsOptional()
  @IsNumber()
  fileSize?: number;

  @ApiPropertyOptional({ example: 'https://s3.amazonaws.com/bucket/file.jpg' })
  @IsOptional()
  @IsString()
  s3Url?: string;

  @ApiPropertyOptional({ example: 'QmXYZ123abc...' })
  @IsOptional()
  @IsString()
  ipfsHash?: string;

  @ApiProperty({
    example: { lat: 12.9716, lng: 77.5946, altitude: 920, accuracy: 5 }
  })
  @IsObject()
  @IsNotEmpty()
  gps: {
    lat: number;
    lng: number;
    altitude?: number;
    accuracy?: number;
  };

  @ApiPropertyOptional({ example: '2024-01-15T10:30:00Z' })
  @IsOptional()
  @IsDateString()
  capturedAt?: Date;

  @ApiPropertyOptional({ example: 'iPhone 14 Pro' })
  @IsOptional()
  @IsString()
  deviceInfo?: string;

  @ApiPropertyOptional({ example: 'ISO 100, f/2.8, 1/125s' })
  @IsOptional()
  @IsString()
  cameraSettings?: string;

  @ApiPropertyOptional({ example: ['mangrove', 'restoration', 'monitoring'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ example: 'Field monitoring photo showing new mangrove growth' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'sha256hashoffile...' })
  @IsOptional()
  @IsString()
  hash?: string;

  @ApiPropertyOptional({ example: 'user-uuid' })
  @IsOptional()
  @IsUUID()
  uploaderId?: string;
}
