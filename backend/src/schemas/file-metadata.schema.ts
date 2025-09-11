import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { FileType } from '../common/enums/user-role.enum';

export type FileMetadataDocument = FileMetadata & Document;

@Schema({ timestamps: true })
export class FileMetadata {
  @Prop({ required: true })
  projectId: string;

  @Prop({ required: true })
  plotId: string;

  @Prop({ required: true })
  uploaderId: string;

  @Prop({ required: true, type: String, enum: FileType })
  fileType: FileType;

  @Prop({ required: true })
  originalName: string;

  @Prop({ required: true })
  fileName: string;

  @Prop({ required: true })
  mimeType: string;

  @Prop({ required: true })
  fileSize: number;

  @Prop()
  s3Url: string;

  @Prop()
  ipfsHash: string;

  @Prop({
    type: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      altitude: { type: Number },
      accuracy: { type: Number },
    },
  })
  gps: {
    lat: number;
    lng: number;
    altitude?: number;
    accuracy?: number;
  };

  @Prop()
  capturedAt: Date;

  @Prop()
  deviceInfo: string;

  @Prop()
  cameraSettings: string;

  @Prop({ default: false })
  isProcessed: boolean;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop()
  verifiedBy: string;

  @Prop()
  verifiedAt: Date;

  @Prop({ type: MongooseSchema.Types.Mixed })
  processingResults: any;

  @Prop()
  tags: string[];

  @Prop()
  description: string;

  @Prop()
  hash: string; // File hash for duplicate detection
}

export const FileMetadataSchema = SchemaFactory.createForClass(FileMetadata);
