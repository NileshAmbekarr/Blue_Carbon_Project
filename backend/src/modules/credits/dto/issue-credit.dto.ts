import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class IssueCreditDto {
  @ApiProperty({ example: '0x1234567890abcdef' })
  @IsString()
  @IsNotEmpty()
  walletAddress: string;

  @ApiProperty({ example: '0xabcdef1234567890' })
  @IsString()
  @IsNotEmpty()
  txHash: string;
}
