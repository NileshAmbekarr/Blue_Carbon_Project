import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CreditsService } from './credits.service';
import { CreateCreditDto } from './dto/create-credit.dto';
import { UpdateCreditDto } from './dto/update-credit.dto';
import { IssueCreditDto } from './dto/issue-credit.dto';
import { RetireCreditDto } from './dto/retire-credit.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, CreditStatus } from '../../common/enums/user-role.enum';

@ApiTags('Credits')
@Controller('credits')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CreditsController {
  constructor(private readonly creditsService: CreditsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new credit batch (Admin only)' })
  @ApiResponse({ status: 201, description: 'Credit batch created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  create(@Body() createCreditDto: CreateCreditDto) {
    return this.creditsService.create(createCreditDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all credits (filtered by role)' })
  @ApiResponse({ status: 200, description: 'Credits retrieved successfully' })
  @ApiQuery({ name: 'status', required: false, enum: CreditStatus })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'batchId', required: false })
  findAll(
    @Request() req,
    @Query('status') status?: CreditStatus,
    @Query('projectId') projectId?: string,
    @Query('batchId') batchId?: string,
  ) {
    if (status) {
      return this.creditsService.findByStatus(status);
    }
    if (projectId) {
      return this.creditsService.findByProject(projectId);
    }
    if (batchId) {
      return this.creditsService.findByBatchId(batchId);
    }
    return this.creditsService.findAll(req.user.role?.name);
  }

  @Get('stats/:projectId')
  @ApiOperation({ summary: 'Get credit statistics for a project' })
  @ApiResponse({ status: 200, description: 'Credit statistics retrieved successfully' })
  getCreditStats(@Param('projectId') projectId: string) {
    return this.creditsService.getTotalCreditsByProject(projectId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get credit by ID' })
  @ApiResponse({ status: 200, description: 'Credit retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Credit not found' })
  findOne(@Param('id') id: string) {
    return this.creditsService.findById(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update credit (Admin only)' })
  @ApiResponse({ status: 200, description: 'Credit updated successfully' })
  @ApiResponse({ status: 404, description: 'Credit not found' })
  update(@Param('id') id: string, @Body() updateCreditDto: UpdateCreditDto) {
    return this.creditsService.update(id, updateCreditDto);
  }

  @Patch(':id/issue')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Issue credit to wallet (Admin only)' })
  @ApiResponse({ status: 200, description: 'Credit issued successfully' })
  @ApiResponse({ status: 403, description: 'Cannot issue credit' })
  issue(@Param('id') id: string, @Body() issueCreditDto: IssueCreditDto) {
    return this.creditsService.issue(id, issueCreditDto.walletAddress, issueCreditDto.txHash);
  }

  @Patch(':id/retire')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DEVELOPER)
  @ApiOperation({ summary: 'Retire credit (Admin/Developer only)' })
  @ApiResponse({ status: 200, description: 'Credit retired successfully' })
  @ApiResponse({ status: 403, description: 'Cannot retire credit' })
  retire(@Param('id') id: string, @Body() retireCreditDto: RetireCreditDto) {
    return this.creditsService.retire(
      id,
      retireCreditDto.walletAddress,
      retireCreditDto.reason,
      retireCreditDto.txHash,
    );
  }

  @Patch(':id/revoke')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Revoke credit (Admin only)' })
  @ApiResponse({ status: 200, description: 'Credit revoked successfully' })
  @ApiResponse({ status: 403, description: 'Cannot revoke credit' })
  revoke(@Param('id') id: string, @Body('txHash') txHash: string) {
    return this.creditsService.revoke(id, txHash);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete credit (Admin only)' })
  @ApiResponse({ status: 200, description: 'Credit deleted successfully' })
  @ApiResponse({ status: 404, description: 'Credit not found' })
  @ApiResponse({ status: 403, description: 'Cannot delete credit' })
  remove(@Param('id') id: string) {
    return this.creditsService.remove(id);
  }
}
