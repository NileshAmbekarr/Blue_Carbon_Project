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
import { MrvService } from './mrv.service';
import { CreateMrvReportDto } from './dto/create-mrv-report.dto';
import { UpdateMrvReportDto } from './dto/update-mrv-report.dto';
import { CreateMonitoringEventDto } from './dto/create-monitoring-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@ApiTags('MRV (Measurement, Reporting, Verification)')
@Controller('mrv')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MrvController {
  constructor(private readonly mrvService: MrvService) {}

  // MRV Reports
  @Post('reports')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DEVELOPER)
  @ApiOperation({ summary: 'Create MRV report (Admin/Developer only)' })
  @ApiResponse({ status: 201, description: 'MRV report created successfully' })
  createReport(@Body() createMrvReportDto: CreateMrvReportDto) {
    return this.mrvService.createReport(createMrvReportDto);
  }

  @Get('reports')
  @ApiOperation({ summary: 'Get all MRV reports' })
  @ApiResponse({ status: 200, description: 'MRV reports retrieved successfully' })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'plotId', required: false })
  @ApiQuery({ name: 'status', required: false })
  findAllReports(
    @Query('projectId') projectId?: string,
    @Query('plotId') plotId?: string,
    @Query('status') status?: string,
  ) {
    if (projectId) {
      return this.mrvService.findReportsByProject(projectId);
    }
    if (plotId) {
      return this.mrvService.findReportsByPlot(plotId);
    }
    if (status) {
      return this.mrvService.findReportsByStatus(status);
    }
    return this.mrvService.findAllReports();
  }

  @Get('reports/stats')
  @ApiOperation({ summary: 'Get MRV report statistics' })
  @ApiResponse({ status: 200, description: 'Report statistics retrieved successfully' })
  @ApiQuery({ name: 'projectId', required: false })
  getReportStats(@Query('projectId') projectId?: string) {
    return this.mrvService.getReportStats(projectId);
  }

  @Get('reports/carbon/:projectId')
  @ApiOperation({ summary: 'Get carbon calculations for project' })
  @ApiResponse({ status: 200, description: 'Carbon calculations retrieved successfully' })
  getCarbonCalculations(@Param('projectId') projectId: string) {
    return this.mrvService.getCarbonCalculations(projectId);
  }

  @Get('reports/:id')
  @ApiOperation({ summary: 'Get MRV report by ID' })
  @ApiResponse({ status: 200, description: 'MRV report retrieved successfully' })
  @ApiResponse({ status: 404, description: 'MRV report not found' })
  findReport(@Param('id') id: string) {
    return this.mrvService.findReportById(id);
  }

  @Patch('reports/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DEVELOPER)
  @ApiOperation({ summary: 'Update MRV report (Admin/Developer only)' })
  @ApiResponse({ status: 200, description: 'MRV report updated successfully' })
  updateReport(@Param('id') id: string, @Body() updateMrvReportDto: UpdateMrvReportDto) {
    return this.mrvService.updateReport(id, updateMrvReportDto);
  }

  @Patch('reports/:id/verify')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AUDITOR)
  @ApiOperation({ summary: 'Verify MRV report (Admin/Auditor only)' })
  @ApiResponse({ status: 200, description: 'MRV report verified successfully' })
  verifyReport(@Param('id') id: string, @Request() req) {
    return this.mrvService.verifyReport(id, req.user.id);
  }

  @Patch('reports/:id/reject')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AUDITOR)
  @ApiOperation({ summary: 'Reject MRV report (Admin/Auditor only)' })
  @ApiResponse({ status: 200, description: 'MRV report rejected successfully' })
  rejectReport(@Param('id') id: string, @Body('reason') reason: string) {
    return this.mrvService.rejectReport(id, reason);
  }

  @Patch('reports/:id/process')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Submit report for processing (Admin only)' })
  @ApiResponse({ status: 200, description: 'Report submitted for processing' })
  submitForProcessing(@Param('id') id: string) {
    return this.mrvService.submitForProcessing(id);
  }

  @Delete('reports/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete MRV report (Admin only)' })
  @ApiResponse({ status: 200, description: 'MRV report deleted successfully' })
  removeReport(@Param('id') id: string) {
    return this.mrvService.removeReport(id);
  }

  // Monitoring Events
  @Post('events')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DEVELOPER)
  @ApiOperation({ summary: 'Create monitoring event (Admin/Developer only)' })
  @ApiResponse({ status: 201, description: 'Monitoring event created successfully' })
  createEvent(@Body() createMonitoringEventDto: CreateMonitoringEventDto, @Request() req) {
    return this.mrvService.createEvent({
      ...createMonitoringEventDto,
      uploaderId: req.user.id,
    });
  }

  @Get('events')
  @ApiOperation({ summary: 'Get all monitoring events' })
  @ApiResponse({ status: 200, description: 'Monitoring events retrieved successfully' })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'plotId', required: false })
  @ApiQuery({ name: 'type', required: false })
  findAllEvents(
    @Query('projectId') projectId?: string,
    @Query('plotId') plotId?: string,
    @Query('type') type?: string,
  ) {
    if (projectId) {
      return this.mrvService.findEventsByProject(projectId);
    }
    if (plotId) {
      return this.mrvService.findEventsByPlot(plotId);
    }
    if (type) {
      return this.mrvService.findEventsByType(type);
    }
    return this.mrvService.findAllEvents();
  }

  @Get('events/stats')
  @ApiOperation({ summary: 'Get monitoring event statistics' })
  @ApiResponse({ status: 200, description: 'Event statistics retrieved successfully' })
  @ApiQuery({ name: 'projectId', required: false })
  getEventStats(@Query('projectId') projectId?: string) {
    return this.mrvService.getEventStats(projectId);
  }

  @Get('events/:id')
  @ApiOperation({ summary: 'Get monitoring event by ID' })
  @ApiResponse({ status: 200, description: 'Monitoring event retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Monitoring event not found' })
  findEvent(@Param('id') id: string) {
    return this.mrvService.findEventById(id);
  }

  @Patch('events/:id/verify')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AUDITOR)
  @ApiOperation({ summary: 'Verify monitoring event (Admin/Auditor only)' })
  @ApiResponse({ status: 200, description: 'Monitoring event verified successfully' })
  verifyEvent(@Param('id') id: string, @Request() req) {
    return this.mrvService.verifyEvent(id, req.user.id);
  }

  @Delete('events/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DEVELOPER)
  @ApiOperation({ summary: 'Delete monitoring event (Admin/Developer only)' })
  @ApiResponse({ status: 200, description: 'Monitoring event deleted successfully' })
  removeEvent(@Param('id') id: string) {
    return this.mrvService.removeEvent(id);
  }
}
