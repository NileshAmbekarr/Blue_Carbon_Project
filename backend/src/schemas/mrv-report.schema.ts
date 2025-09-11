import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MrvReportDocument = MrvReport & Document;

@Schema({ timestamps: true })
export class MrvReport {
  @Prop({ required: true })
  projectId: string;

  @Prop({ required: true })
  plotId: string;

  @Prop({ required: true })
  reportType: string; // 'baseline', 'monitoring', 'verification'

  @Prop({ required: true })
  methodology: string; // 'NDVI', 'biomass', 'soil_carbon'

  @Prop({ 
    type: {
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true }
    },
    required: true
   })
  reportingPeriod: {
    startDate: Date;
    endDate: Date;
  };

  @Prop({
    type: {
      biomass: { type: Number },
      carbonTons: { type: Number },
      carbonTonsCO2e: { type: Number },
      uncertainty: { type: Number },
      confidence: { type: Number },
      methodology: { type: String },
      calculationDetails: { type: Object },
    },
    required: true,
  })
  results: {
    biomass: number;
    carbonTons: number;
    carbonTonsCO2e: number;
    uncertainty: number;
    confidence: number;
    methodology: string;
    calculationDetails: any;
  };

  @Prop({
    type: {
      ndvi: { type: Number },
      lai: { type: Number }, // Leaf Area Index
      biomassIndex: { type: Number },
      vegetationCover: { type: Number },
      soilMoisture: { type: Number },
    },
  })
  satelliteData: {
    ndvi?: number;
    lai?: number;
    biomassIndex?: number;
    vegetationCover?: number;
    soilMoisture?: number;
  };

  @Prop({
    type: {
      droneImagery: [{ type: String }],
      orthomosaic: { type: String },
      dem: { type: String }, // Digital Elevation Model
      vegetationMap: { type: String },
    },
  })
  droneData: {
    droneImagery?: string[];
    orthomosaic?: string;
    dem?: string;
    vegetationMap?: string;
  };

  @Prop({
    type: {
      fieldPhotos: [{ type: String }],
      gpsPoints: [{ 
        lat: { type: Number },
        lng: { type: Number },
        measurement: { type: String },
        value: { type: Number }
      }],
      soilSamples: [{ type: Object }],
      vegetationSamples: [{ type: Object }],
    },
  })
  fieldData: {
    fieldPhotos?: string[];
    gpsPoints?: Array<{
      lat: number;
      lng: number;
      measurement: string;
      value: number;
    }>;
    soilSamples?: any[];
    vegetationSamples?: any[];
  };

  @Prop()
  pdfReportUrl: string;

  @Prop()
  ipfsHash: string;

  @Prop({ default: 'pending' })
  status: string; // 'pending', 'processing', 'completed', 'verified', 'rejected'

  @Prop()
  processedBy: string; // MRV engine service ID

  @Prop()
  processedAt: Date;

  @Prop()
  verifiedBy: string; // Auditor user ID

  @Prop()
  verifiedAt: Date;

  @Prop()
  rejectionReason: string;

  @Prop({
    type: {
      qualityScore: { type: Number },
      dataCompleteness: { type: Number },
      spatialAccuracy: { type: Number },
      temporalConsistency: { type: Number },
      issues: [{ type: String }],
    },
  })
  qualityAssessment: {
    qualityScore?: number;
    dataCompleteness?: number;
    spatialAccuracy?: number;
    temporalConsistency?: number;
    issues?: string[];
  };

  @Prop()
  notes: string;

  @Prop()
  tags: string[];
}

export const MrvReportSchema = SchemaFactory.createForClass(MrvReport);
