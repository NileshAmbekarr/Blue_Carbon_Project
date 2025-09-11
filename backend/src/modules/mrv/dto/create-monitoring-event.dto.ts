import { IsString, IsNotEmpty, IsOptional, IsUUID, IsObject, IsNumber, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMonitoringEventDto {
  @ApiProperty({ example: 'project-uuid' })
  @IsUUID()
  @IsNotEmpty()
  projectId: string;

  @ApiProperty({ example: 'plot-uuid' })
  @IsUUID()
  @IsNotEmpty()
  plotId: string;

  @ApiProperty({ example: 'plantation' })
  @IsString()
  @IsNotEmpty()
  eventType: string;

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

  @ApiProperty({
    example: {
      notes: 'Planted 50 mangrove saplings',
      photoUrls: ['photo1.jpg', 'photo2.jpg'],
      measurements: { saplings_planted: 50, survival_rate: 95 },
      weather: {
        temperature: 28,
        humidity: 75,
        windSpeed: 5,
        conditions: 'Partly cloudy'
      },
      participants: ['John Doe', 'Jane Smith'],
      equipment: ['Shovels', 'Measuring tape', 'GPS device']
    }
  })
  @IsObject()
  @IsNotEmpty()
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

  @ApiPropertyOptional({ example: 120 })
  @IsOptional()
  @IsNumber()
  duration?: number;

  @ApiPropertyOptional({ example: ['plantation', 'mangrove', 'restoration'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ example: ['file-id-1', 'file-id-2'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  relatedFiles?: string[];

  @ApiPropertyOptional({ example: 'user-uuid' })
  @IsOptional()
  @IsUUID()
  uploaderId?: string;
}
