import { IsString, IsNotEmpty, IsOptional, IsUUID, IsDecimal, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreatePlotDto {
  @ApiProperty({ example: 'Plot A - Mangrove Area' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Main restoration area for mangroves' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ 
    example: {
      type: 'Polygon',
      coordinates: [[[77.5946, 12.9716], [77.5956, 12.9716], [77.5956, 12.9726], [77.5946, 12.9726], [77.5946, 12.9716]]]
    }
  })
  @IsObject()
  @IsNotEmpty()
  geojsonPolygon: any;

  @ApiProperty({ example: 25.75 })
  @IsDecimal()
  @IsNotEmpty()
  @Transform(({ value }) => parseFloat(value))
  areaHectares: number;

  @ApiPropertyOptional({ example: 'Clay loam' })
  @IsOptional()
  @IsString()
  soilType?: string;

  @ApiPropertyOptional({ example: 'Mangrove forest' })
  @IsOptional()
  @IsString()
  vegetationType?: string;

  @ApiPropertyOptional({ example: 150.25 })
  @IsOptional()
  @IsDecimal()
  @Transform(({ value }) => parseFloat(value))
  baselineBiomass?: number;

  @ApiProperty({ example: 'project-uuid' })
  @IsUUID()
  @IsNotEmpty()
  projectId: string;
}
