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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiQuery } from '@nestjs/swagger';
import { FilesService } from './files.service';
import { CreateFileMetadataDto } from './dto/create-file-metadata.dto';
import { UpdateFileMetadataDto } from './dto/update-file-metadata.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, FileType } from '../../common/enums/user-role.enum';

@ApiTags('Files')
@Controller('files')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DEVELOPER)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload file with metadata (Admin/Developer only)' })
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() createFileMetadataDto: CreateFileMetadataDto,
    @Request() req,
  ) {
    // TODO: Implement actual file upload to S3 and IPFS
    // For now, just create metadata
    const fileHash = await this.filesService.generateFileHash(file.buffer);
    
    const metadata = {
      ...createFileMetadataDto,
      uploaderId: req.user.id,
      originalName: file.originalname,
      fileName: `${Date.now()}-${file.originalname}`,
      mimeType: file.mimetype,
      fileSize: file.size,
      hash: fileHash,
    };

    return this.filesService.create(metadata);
  }

  @Post('metadata')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DEVELOPER)
  @ApiOperation({ summary: 'Create file metadata (Admin/Developer only)' })
  @ApiResponse({ status: 201, description: 'File metadata created successfully' })
  create(@Body() createFileMetadataDto: CreateFileMetadataDto, @Request() req) {
    return this.filesService.create({
      ...createFileMetadataDto,
      uploaderId: req.user.id,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all file metadata' })
  @ApiResponse({ status: 200, description: 'File metadata retrieved successfully' })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'plotId', required: false })
  @ApiQuery({ name: 'type', required: false, enum: FileType })
  @ApiQuery({ name: 'uploaderId', required: false })
  findAll(
    @Query('projectId') projectId?: string,
    @Query('plotId') plotId?: string,
    @Query('type') type?: FileType,
    @Query('uploaderId') uploaderId?: string,
  ) {
    if (projectId) {
      return this.filesService.findByProject(projectId);
    }
    if (plotId) {
      return this.filesService.findByPlot(plotId);
    }
    if (type) {
      return this.filesService.findByType(type);
    }
    if (uploaderId) {
      return this.filesService.findByUploader(uploaderId);
    }
    return this.filesService.findAll();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get file statistics' })
  @ApiResponse({ status: 200, description: 'File statistics retrieved successfully' })
  @ApiQuery({ name: 'projectId', required: false })
  getStats(@Query('projectId') projectId?: string) {
    return this.filesService.getFileStats(projectId);
  }

  @Get('search/nearby')
  @ApiOperation({ summary: 'Find files near location' })
  @ApiResponse({ status: 200, description: 'Nearby files retrieved successfully' })
  @ApiQuery({ name: 'lat', required: true })
  @ApiQuery({ name: 'lng', required: true })
  @ApiQuery({ name: 'radius', required: true })
  findNearby(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radius') radius: number,
  ) {
    return this.filesService.findFilesNearLocation(lat, lng, radius);
  }

  @Get('search/timerange')
  @ApiOperation({ summary: 'Find files in time range' })
  @ApiResponse({ status: 200, description: 'Files in time range retrieved successfully' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  @ApiQuery({ name: 'projectId', required: false })
  findInTimeRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('projectId') projectId?: string,
  ) {
    return this.filesService.findFilesInTimeRange(
      new Date(startDate),
      new Date(endDate),
      projectId,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get file metadata by ID' })
  @ApiResponse({ status: 200, description: 'File metadata retrieved successfully' })
  @ApiResponse({ status: 404, description: 'File metadata not found' })
  findOne(@Param('id') id: string) {
    return this.filesService.findById(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DEVELOPER)
  @ApiOperation({ summary: 'Update file metadata (Admin/Developer only)' })
  @ApiResponse({ status: 200, description: 'File metadata updated successfully' })
  @ApiResponse({ status: 404, description: 'File metadata not found' })
  update(@Param('id') id: string, @Body() updateFileMetadataDto: UpdateFileMetadataDto) {
    return this.filesService.update(id, updateFileMetadataDto);
  }

  @Patch(':id/verify')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AUDITOR)
  @ApiOperation({ summary: 'Verify file (Admin/Auditor only)' })
  @ApiResponse({ status: 200, description: 'File verified successfully' })
  verify(@Param('id') id: string, @Request() req) {
    return this.filesService.markAsVerified(id, req.user.id);
  }

  @Patch(':id/process')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Mark file as processed (Admin only)' })
  @ApiResponse({ status: 200, description: 'File marked as processed' })
  markProcessed(@Param('id') id: string, @Body('results') results: any) {
    return this.filesService.markAsProcessed(id, results);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DEVELOPER)
  @ApiOperation({ summary: 'Delete file metadata (Admin/Developer only)' })
  @ApiResponse({ status: 200, description: 'File metadata deleted successfully' })
  @ApiResponse({ status: 404, description: 'File metadata not found' })
  remove(@Param('id') id: string) {
    return this.filesService.remove(id);
  }
}
