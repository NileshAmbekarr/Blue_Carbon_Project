import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FileMetadata, FileMetadataDocument } from '../../schemas/file-metadata.schema';
import { CreateFileMetadataDto } from './dto/create-file-metadata.dto';
import { UpdateFileMetadataDto } from './dto/update-file-metadata.dto';
import { FileType } from '../../common/enums/user-role.enum';
import * as crypto from 'crypto';

@Injectable()
export class FilesService {
  constructor(
    @InjectModel(FileMetadata.name)
    private fileMetadataModel: Model<FileMetadataDocument>,
  ) {}

  async create(createFileMetadataDto: CreateFileMetadataDto): Promise<FileMetadata> {
    const fileMetadata = new this.fileMetadataModel(createFileMetadataDto);
    return fileMetadata.save();
  }

  async findAll(): Promise<FileMetadata[]> {
    return this.fileMetadataModel.find().exec();
  }

  async findById(id: string): Promise<FileMetadata> {
    const fileMetadata = await this.fileMetadataModel.findById(id).exec();
    if (!fileMetadata) {
      throw new NotFoundException('File metadata not found');
    }
    return fileMetadata;
  }

  async findByProject(projectId: string): Promise<FileMetadata[]> {
    return this.fileMetadataModel.find({ projectId }).exec();
  }

  async findByPlot(plotId: string): Promise<FileMetadata[]> {
    return this.fileMetadataModel.find({ plotId }).exec();
  }

  async findByUploader(uploaderId: string): Promise<FileMetadata[]> {
    return this.fileMetadataModel.find({ uploaderId }).exec();
  }

  async findByType(fileType: FileType): Promise<FileMetadata[]> {
    return this.fileMetadataModel.find({ fileType }).exec();
  }

  async findByHash(hash: string): Promise<FileMetadata[]> {
    return this.fileMetadataModel.find({ hash }).exec();
  }

  async update(id: string, updateFileMetadataDto: UpdateFileMetadataDto): Promise<FileMetadata> {
    const updatedFile = await this.fileMetadataModel
      .findByIdAndUpdate(id, updateFileMetadataDto, { new: true })
      .exec();

    if (!updatedFile) {
      throw new NotFoundException('File metadata not found');
    }

    return updatedFile;
  }

  async remove(id: string): Promise<void> {
    const result = await this.fileMetadataModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('File metadata not found');
    }
  }

  async validateGPS(plotId: string, lat: number, lng: number): Promise<boolean> {
    // TODO: Implement actual geofence validation with plot boundaries
    // This would query the plots table and check if GPS coordinates are within polygon
    return true; // Placeholder
  }

  async checkDuplicate(hash: string): Promise<boolean> {
    const existingFiles = await this.findByHash(hash);
    return existingFiles.length > 0;
  }

  async generateFileHash(buffer: Buffer): Promise<string> {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  async markAsProcessed(id: string, processingResults: any): Promise<FileMetadata> {
    return this.update(id, {
      isProcessed: true,
      processingResults,
    });
  }

  async markAsVerified(id: string, verifiedBy: string): Promise<FileMetadata> {
    return this.update(id, {
      isVerified: true,
      verifiedBy,
      verifiedAt: new Date(),
    });
  }

  async getFileStats(projectId?: string): Promise<{
    total: number;
    byType: Record<string, number>;
    processed: number;
    verified: number;
  }> {
    const query = projectId ? { projectId } : {};
    const files = await this.fileMetadataModel.find(query).exec();

    const byType = files.reduce((acc, file) => {
      acc[file.fileType] = (acc[file.fileType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: files.length,
      byType,
      processed: files.filter(f => f.isProcessed).length,
      verified: files.filter(f => f.isVerified).length,
    };
  }

  async findFilesInTimeRange(
    startDate: Date,
    endDate: Date,
    projectId?: string,
  ): Promise<FileMetadata[]> {
    const query: any = {
      capturedAt: {
        $gte: startDate,
        $lte: endDate,
      },
    };

    if (projectId) {
      query.projectId = projectId;
    }

    return this.fileMetadataModel.find(query).exec();
  }

  async findFilesNearLocation(
    lat: number,
    lng: number,
    radiusKm: number,
  ): Promise<FileMetadata[]> {
    // MongoDB geospatial query for files within radius
    return this.fileMetadataModel.find({
      'gps': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat], // MongoDB uses [longitude, latitude]
          },
          $maxDistance: radiusKm * 1000, // Convert km to meters
        },
      },
    }).exec();
  }
}
