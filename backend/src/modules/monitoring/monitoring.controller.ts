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
import { MonitoringService } from './monitoring.service';
import { CreateMonitoringEventDto } from './dto/create-monitoring-event.dto';
import { UpdateMonitoringEventDto } from './dto/update-monitoring-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@ApiTags('Monitoring')
@Controller('monitoring')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DEVELOPER)
  @ApiOperation({ summary: 'Create a new monitoring event (Admin/Developer only)' })
  @ApiResponse({ status: 201, description: 'Monitoring event created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  create(@Body() createMonitoringEventDto: CreateMonitoringEventDto, @Request() req) {
    return this.monitoringService.create(createMonitoringEventDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all monitoring events' })
  @ApiResponse({ status: 200, description: 'Monitoring events retrieved successfully' })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'plotId', required: false })
  findAll(
    @Query('projectId') projectId?: string,
    @Query('plotId') plotId?: string,
    @Request() req?: any
  ) {
    if (projectId) {
      return this.monitoringService.findByProject(projectId);
    }
    if (plotId) {
      return this.monitoringService.findByPlot(plotId);
    }
    return this.monitoringService.findAll(req.user.id, req.user.role?.name);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get monitoring event by ID' })
  @ApiResponse({ status: 200, description: 'Monitoring event retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Monitoring event not found' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.monitoringService.findById(id, req.user.id, req.user.role?.name);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DEVELOPER)
  @ApiOperation({ summary: 'Update monitoring event (Admin/Developer only)' })
  @ApiResponse({ status: 200, description: 'Monitoring event updated successfully' })
  @ApiResponse({ status: 404, description: 'Monitoring event not found' })
  update(@Param('id') id: string, @Body() updateMonitoringEventDto: UpdateMonitoringEventDto, @Request() req) {
    return this.monitoringService.update(id, updateMonitoringEventDto, req.user.id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DEVELOPER)
  @ApiOperation({ summary: 'Delete monitoring event (Admin/Developer only)' })
  @ApiResponse({ status: 200, description: 'Monitoring event deleted successfully' })
  @ApiResponse({ status: 404, description: 'Monitoring event not found' })
  remove(@Param('id') id: string, @Request() req) {
    return this.monitoringService.remove(id, req.user.id);
  }
}
