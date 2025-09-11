import { IsString, IsNotEmpty, IsOptional, IsEnum, IsBoolean, IsEmail, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrganizationType } from '../../../common/enums/user-role.enum';

export class CreateOrganizationDto {
  @ApiProperty({ example: 'Green Earth NGO' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: OrganizationType, example: OrganizationType.NGO })
  @IsEnum(OrganizationType)
  @IsNotEmpty()
  type: OrganizationType;

  @ApiPropertyOptional({ example: 'Environmental conservation organization' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '123 Green Street, Eco City, EC 12345' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: '+1234567890' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'contact@greenearth.org' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'https://greenearth.org' })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({ example: 'REG123456789' })
  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  kycStatus?: boolean;

  @ApiPropertyOptional({ example: 'document-urls-json' })
  @IsOptional()
  @IsString()
  kycDocuments?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
