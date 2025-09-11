import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BlockchainService } from './blockchain.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@ApiTags('Blockchain')
@Controller('blockchain')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BlockchainController {
  constructor(private readonly blockchainService: BlockchainService) {}

  @Get('network')
  @ApiOperation({ summary: 'Get blockchain network information' })
  @ApiResponse({ status: 200, description: 'Network information retrieved successfully' })
  getNetworkInfo() {
    return this.blockchainService.getNetworkInfo();
  }

  @Get('wallet')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get wallet information (Admin only)' })
  @ApiResponse({ status: 200, description: 'Wallet information retrieved successfully' })
  getWalletInfo() {
    return this.blockchainService.getWalletInfo();
  }

  @Get('gas-price')
  @ApiOperation({ summary: 'Get current gas price' })
  @ApiResponse({ status: 200, description: 'Gas price retrieved successfully' })
  getCurrentGasPrice() {
    return this.blockchainService.getCurrentGasPrice();
  }

  @Get('transaction/:txHash')
  @ApiOperation({ summary: 'Get transaction status' })
  @ApiResponse({ status: 200, description: 'Transaction status retrieved successfully' })
  getTransactionStatus(@Param('txHash') txHash: string) {
    return this.blockchainService.getTransactionStatus(txHash);
  }

  @Get('verify/:txHash')
  @ApiOperation({ summary: 'Verify transaction' })
  @ApiResponse({ status: 200, description: 'Transaction verification result' })
  verifyTransaction(@Param('txHash') txHash: string) {
    return this.blockchainService.verifyTransaction(txHash);
  }

  @Post('anchor/project')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Anchor project registration on blockchain (Admin only)' })
  @ApiResponse({ status: 200, description: 'Project anchored successfully' })
  anchorProject(@Body() data: { projectId: string; ipfsHash: string }) {
    return this.blockchainService.anchorProjectRegistration(data.projectId, data.ipfsHash);
  }

  @Post('anchor/mrv')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AUDITOR)
  @ApiOperation({ summary: 'Anchor MRV report on blockchain (Admin/Auditor only)' })
  @ApiResponse({ status: 200, description: 'MRV report anchored successfully' })
  anchorMrvReport(@Body() data: { reportId: string; ipfsHash: string }) {
    return this.blockchainService.anchorMrvReport(data.reportId, data.ipfsHash);
  }

  @Post('credits/issue')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Issue carbon credits on blockchain (Admin only)' })
  @ApiResponse({ status: 200, description: 'Credits issued successfully' })
  issueCredits(@Body() data: {
    projectId: string;
    batchId: string;
    amount: number;
    recipientAddress: string;
  }) {
    return this.blockchainService.issueCarbonCredits(
      data.projectId,
      data.batchId,
      data.amount,
      data.recipientAddress,
    );
  }

  @Post('credits/retire')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DEVELOPER)
  @ApiOperation({ summary: 'Retire carbon credits on blockchain (Admin/Developer only)' })
  @ApiResponse({ status: 200, description: 'Credits retired successfully' })
  retireCredits(@Body() data: {
    batchId: string;
    amount: number;
    retirementReason: string;
  }) {
    return this.blockchainService.retireCarbonCredits(
      data.batchId,
      data.amount,
      data.retirementReason,
    );
  }

  @Post('credits/revoke')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Revoke carbon credits on blockchain (Admin only)' })
  @ApiResponse({ status: 200, description: 'Credits revoked successfully' })
  revokeCredits(@Body() data: { batchId: string; amount: number }) {
    return this.blockchainService.revokeCarbonCredits(data.batchId, data.amount);
  }

  @Post('ipfs/store')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DEVELOPER)
  @ApiOperation({ summary: 'Store data on IPFS (Admin/Developer only)' })
  @ApiResponse({ status: 200, description: 'Data stored on IPFS successfully' })
  storeOnIPFS(@Body() data: any) {
    return this.blockchainService.storeOnIPFS(data);
  }

  @Get('ipfs/:hash')
  @ApiOperation({ summary: 'Retrieve data from IPFS' })
  @ApiResponse({ status: 200, description: 'Data retrieved from IPFS successfully' })
  retrieveFromIPFS(@Param('hash') hash: string) {
    return this.blockchainService.retrieveFromIPFS(hash);
  }

  @Post('estimate-gas')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Estimate gas for transaction (Admin only)' })
  @ApiResponse({ status: 200, description: 'Gas estimation completed' })
  estimateGas(@Body() data: { functionName: string; params: any[] }) {
    return this.blockchainService.estimateGas(data.functionName, data.params);
  }
}
