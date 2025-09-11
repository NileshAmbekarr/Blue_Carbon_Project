import { IsString, IsNotEmpty, IsOptional, IsUUID, IsDecimal } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateCreditDto {
  @ApiPropertyOptional({ example: 'BC-PROJ123-1699123456789' })
  @IsOptional()
  @IsString()
  batchId?: string;

  @ApiProperty({ example: 250.75 })
  @IsDecimal()
  @IsNotEmpty()
  @Transform(({ value }) => parseFloat(value))
  amountTCO2e: number;

  @ApiPropertyOptional({ example: '0x1234567890abcdef' })
  @IsOptional()
  @IsString()
  issuedToWallet?: string;

  @ApiPropertyOptional({ example: 'QmXYZ123...' })
  @IsOptional()
  @IsString()
  ipfsHash?: string;

  @ApiProperty({ example: 'project-uuid' })
  @IsUUID()
  @IsNotEmpty()
  projectId: string;
}
