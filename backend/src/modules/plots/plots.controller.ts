import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PlotsService } from './plots.service';
import { CreatePlotDto } from './dto/create-plot.dto';
import { UpdatePlotDto } from './dto/update-plot.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@ApiTags('Plots')
@Controller('plots')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PlotsController {
  constructor(private readonly plotsService: PlotsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DEVELOPER)
  @ApiOperation({ summary: 'Create a new plot (Admin/Developer only)' })
  @ApiResponse({ status: 201, description: 'Plot created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  create(@Body() createPlotDto: CreatePlotDto) {
    return this.plotsService.create(createPlotDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all plots' })
  @ApiResponse({ status: 200, description: 'Plots retrieved successfully' })
  @ApiQuery({ name: 'projectId', required: false })
  findAll(@Query('projectId') projectId?: string) {
    if (projectId) {
      return this.plotsService.findByProject(projectId);
    }
    return this.plotsService.findAll();
  }

  @Get('search/nearby')
  @ApiOperation({ summary: 'Find plots within radius' })
  @ApiResponse({ status: 200, description: 'Nearby plots retrieved successfully' })
  @ApiQuery({ name: 'lat', required: true })
  @ApiQuery({ name: 'lng', required: true })
  @ApiQuery({ name: 'radius', required: true })
  findNearby(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radius') radius: number,
  ) {
    return this.plotsService.findPlotsWithinRadius(lat, lng, radius);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get plot by ID' })
  @ApiResponse({ status: 200, description: 'Plot retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Plot not found' })
  findOne(@Param('id') id: string) {
    return this.plotsService.findById(id);
  }

  @Get(':id/validate-geofence')
  @ApiOperation({ summary: 'Validate GPS coordinates within plot boundary' })
  @ApiResponse({ status: 200, description: 'Geofence validation result' })
  @ApiQuery({ name: 'lat', required: true })
  @ApiQuery({ name: 'lng', required: true })
  validateGeofence(
    @Param('id') id: string,
    @Query('lat') lat: number,
    @Query('lng') lng: number,
  ) {
    return this.plotsService.validateGeofence(id, lat, lng);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DEVELOPER)
  @ApiOperation({ summary: 'Update plot (Admin/Developer only)' })
  @ApiResponse({ status: 200, description: 'Plot updated successfully' })
  @ApiResponse({ status: 404, description: 'Plot not found' })
  update(@Param('id') id: string, @Body() updatePlotDto: UpdatePlotDto) {
    return this.plotsService.update(id, updatePlotDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DEVELOPER)
  @ApiOperation({ summary: 'Delete plot (Admin/Developer only)' })
  @ApiResponse({ status: 200, description: 'Plot deleted successfully' })
  @ApiResponse({ status: 404, description: 'Plot not found' })
  remove(@Param('id') id: string) {
    return this.plotsService.remove(id);
  }
}
