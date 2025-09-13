import { IsString, IsOptional, IsDateString, IsObject, IsUUID, IsNumber, IsArray, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMonitoringEventDto {
  @ApiProperty({ description: 'Project ID this monitoring event belongs to' })
  @IsUUID()
  projectId: string;

  @ApiProperty({ description: 'Plot ID this monitoring event belongs to' })
  @IsUUID()
  plotId: string;

  @ApiProperty({ description: 'Type of monitoring event' })
  @IsString()
  eventType: string;

  @ApiProperty({ description: 'GPS coordinates' })
  @IsObject()
  gps: {
    lat: number;
    lng: number;
    altitude?: number;
    accuracy?: number;
  };

  @ApiProperty({ description: 'Event data including notes, photos, measurements' })
  @IsObject()
  data: {
    notes?: string;
    photoUrls?: string[];
    measurements?: any;
    weather?: {
      temperature?: number;
      humidity?: number;
      windSpeed?: number;
      conditions?: string;
    };
    participants?: string[];
    equipment?: string[];
  };

  @ApiProperty({ description: 'Duration in minutes', required: false })
  @IsOptional()
  @IsNumber()
  duration?: number;

  @ApiProperty({ description: 'Tags for categorization', required: false })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiProperty({ description: 'Related file IDs', required: false })
  @IsOptional()
  @IsArray()
  relatedFiles?: string[];
}
