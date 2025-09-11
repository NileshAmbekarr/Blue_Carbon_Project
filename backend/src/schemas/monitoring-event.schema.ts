import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MonitoringEventDocument = MonitoringEvent & Document;

@Schema({ timestamps: true })
export class MonitoringEvent {
  @Prop({ required: true })
  projectId: string;

  @Prop({ required: true })
  plotId: string;

  @Prop({ required: true })
  uploaderId: string;

  @Prop({ required: true })
  eventType: string; // 'plantation', 'verification', 'drone_scan', 'maintenance', 'harvesting'

  @Prop({
    type: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      altitude: { type: Number },
      accuracy: { type: Number },
    },
    required: true,
  })
  gps: {
    lat: number;
    lng: number;
    altitude?: number;
    accuracy?: number;
  };

  @Prop({
    type: {
      notes: { type: String },
      photoUrls: [{ type: String }],
      measurements: { type: Object },
      weather: {
        temperature: { type: Number },
        humidity: { type: Number },
        windSpeed: { type: Number },
        conditions: { type: String },
      },
      participants: [{ type: String }],
      equipment: [{ type: String }],
    },
    required: true,
  })
  data: {
    notes?: string;
    photoUrls?: string[];
    measurements?: any;
    weather?: {
      temperature?: number;
      humidity?: number;
      windSpeed?: number;
      conditions?: string;
    };
    participants?: string[];
    equipment?: string[];
  };

  @Prop()
  duration: number; // Duration in minutes

  @Prop({ default: false })
  isVerified: boolean;

  @Prop()
  verifiedBy: string;

  @Prop()
  verifiedAt: Date;

  @Prop()
  tags: string[];

  @Prop()
  relatedFiles: string[]; // File IDs from FileMetadata collection
}

export const MonitoringEventSchema = SchemaFactory.createForClass(MonitoringEvent);
