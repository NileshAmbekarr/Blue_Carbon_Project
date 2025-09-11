import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RetireCreditDto {
  @ApiProperty({ example: '0x1234567890abcdef' })
  @IsString()
  @IsNotEmpty()
  walletAddress: string;

  @ApiProperty({ example: 'Voluntary retirement for carbon neutrality' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({ example: '0xabcdef1234567890' })
  @IsString()
  @IsNotEmpty()
  txHash: string;
}
