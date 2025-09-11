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
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, ProjectStatus } from '../../common/enums/user-role.enum';

@ApiTags('Projects')
@Controller('projects')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DEVELOPER)
  @ApiOperation({ summary: 'Create a new project (Admin/Developer only)' })
  @ApiResponse({ status: 201, description: 'Project created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  create(@Body() createProjectDto: CreateProjectDto, @Request() req) {
    return this.projectsService.create(createProjectDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all projects (filtered by role)' })
  @ApiResponse({ status: 200, description: 'Projects retrieved successfully' })
  @ApiQuery({ name: 'status', required: false, enum: ProjectStatus })
  @ApiQuery({ name: 'organizationId', required: false })
  findAll(@Request() req, @Query('status') status?: ProjectStatus, @Query('organizationId') organizationId?: string) {
    if (status) {
      return this.projectsService.findByStatus(status);
    }
    if (organizationId) {
      return this.projectsService.findByOrganization(organizationId);
    }
    return this.projectsService.findAll(req.user.id, req.user.role?.name);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by ID' })
  @ApiResponse({ status: 200, description: 'Project retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.projectsService.findById(id, req.user.id, req.user.role?.name);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DEVELOPER)
  @ApiOperation({ summary: 'Update project (Admin/Developer only)' })
  @ApiResponse({ status: 200, description: 'Project updated successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto, @Request() req) {
    return this.projectsService.update(id, updateProjectDto, req.user.id, req.user.role?.name);
  }

  @Patch(':id/submit')
  @UseGuards(RolesGuard)
  @Roles(UserRole.DEVELOPER)
  @ApiOperation({ summary: 'Submit project for review (Developer only)' })
  @ApiResponse({ status: 200, description: 'Project submitted successfully' })
  @ApiResponse({ status: 403, description: 'Cannot submit project' })
  submit(@Param('id') id: string, @Request() req) {
    return this.projectsService.submit(id, req.user.id);
  }

  @Patch(':id/approve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AUDITOR)
  @ApiOperation({ summary: 'Approve project (Admin/Auditor only)' })
  @ApiResponse({ status: 200, description: 'Project approved successfully' })
  approve(@Param('id') id: string, @Request() req) {
    return this.projectsService.approve(id, req.user.id);
  }

  @Patch(':id/reject')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AUDITOR)
  @ApiOperation({ summary: 'Reject project (Admin/Auditor only)' })
  @ApiResponse({ status: 200, description: 'Project rejected successfully' })
  reject(@Param('id') id: string, @Request() req) {
    return this.projectsService.reject(id, req.user.id);
  }

  @Patch(':id/activate')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Activate project (Admin only)' })
  @ApiResponse({ status: 200, description: 'Project activated successfully' })
  activate(@Param('id') id: string, @Request() req) {
    return this.projectsService.activate(id, req.user.id);
  }

  @Patch(':id/complete')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Complete project (Admin only)' })
  @ApiResponse({ status: 200, description: 'Project completed successfully' })
  complete(@Param('id') id: string, @Request() req) {
    return this.projectsService.complete(id, req.user.id);
  }

  @Patch(':id/suspend')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Suspend project (Admin only)' })
  @ApiResponse({ status: 200, description: 'Project suspended successfully' })
  suspend(@Param('id') id: string, @Request() req) {
    return this.projectsService.suspend(id, req.user.id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DEVELOPER)
  @ApiOperation({ summary: 'Delete project (Admin/Developer only)' })
  @ApiResponse({ status: 200, description: 'Project deleted successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiResponse({ status: 403, description: 'Cannot delete project' })
  remove(@Param('id') id: string, @Request() req) {
    return this.projectsService.remove(id, req.user.id, req.user.role?.name);
  }
}
