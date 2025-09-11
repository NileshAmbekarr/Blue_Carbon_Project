import { IsString, IsNotEmpty, IsOptional, IsUUID, IsObject, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMrvReportDto {
  @ApiProperty({ example: 'project-uuid' })
  @IsUUID()
  @IsNotEmpty()
  projectId: string;

  @ApiProperty({ example: 'plot-uuid' })
  @IsUUID()
  @IsNotEmpty()
  plotId: string;

  @ApiProperty({ example: 'baseline' })
  @IsString()
  @IsNotEmpty()
  reportType: string;

  @ApiProperty({ example: 'NDVI' })
  @IsString()
  @IsNotEmpty()
  methodology: string;

  @ApiProperty({
    example: {
      startDate: '2024-01-01T00:00:00Z',
      endDate: '2024-12-31T23:59:59Z'
    }
  })
  @IsObject()
  @IsNotEmpty()
  reportingPeriod: {
    startDate: Date;
    endDate: Date;
  };

  @ApiProperty({
    example: {
      biomass: 150.5,
      carbonTons: 75.25,
      carbonTonsCO2e: 276.42,
      uncertainty: 5.2,
      confidence: 95.0,
      methodology: 'NDVI-based calculation',
      calculationDetails: {}
    }
  })
  @IsObject()
  @IsNotEmpty()
  results: {
    biomass: number;
    carbonTons: number;
    carbonTonsCO2e: number;
    uncertainty: number;
    confidence: number;
    methodology: string;
    calculationDetails: any;
  };

  @ApiPropertyOptional({
    example: {
      ndvi: 0.75,
      lai: 3.2,
      biomassIndex: 0.68,
      vegetationCover: 85.5,
      soilMoisture: 45.2
    }
  })
  @IsOptional()
  @IsObject()
  satelliteData?: {
    ndvi?: number;
    lai?: number;
    biomassIndex?: number;
    vegetationCover?: number;
    soilMoisture?: number;
  };

  @ApiPropertyOptional({
    example: {
      droneImagery: ['image1.jpg', 'image2.jpg'],
      orthomosaic: 'orthomosaic.tif',
      dem: 'elevation.tif',
      vegetationMap: 'vegetation.tif'
    }
  })
  @IsOptional()
  @IsObject()
  droneData?: {
    droneImagery?: string[];
    orthomosaic?: string;
    dem?: string;
    vegetationMap?: string;
  };

  @ApiPropertyOptional({
    example: {
      fieldPhotos: ['field1.jpg', 'field2.jpg'],
      gpsPoints: [
        { lat: 12.9716, lng: 77.5946, measurement: 'tree_height', value: 15.5 }
      ],
      soilSamples: [],
      vegetationSamples: []
    }
  })
  @IsOptional()
  @IsObject()
  fieldData?: {
    fieldPhotos?: string[];
    gpsPoints?: Array<{
      lat: number;
      lng: number;
      measurement: string;
      value: number;
    }>;
    soilSamples?: any[];
    vegetationSamples?: any[];
  };

  @ApiPropertyOptional({ example: 'https://s3.amazonaws.com/reports/mrv-report.pdf' })
  @IsOptional()
  @IsString()
  pdfReportUrl?: string;

  @ApiPropertyOptional({ example: 'QmXYZ123abc...' })
  @IsOptional()
  @IsString()
  ipfsHash?: string;

  @ApiPropertyOptional({ example: 'Field notes and observations' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: ['carbon', 'biomass', 'monitoring'] })
  @IsOptional()
  tags?: string[];
}
