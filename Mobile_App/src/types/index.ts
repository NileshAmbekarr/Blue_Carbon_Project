// User and Authentication Types
export interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  organization?: Organization;
  profile: {
    firstName: string;
    lastName: string;
    phone?: string;
    avatar?: string;
  };
  permissions: Permission[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'admin' | 'auditor' | 'developer' | 'ngo_staff' | 'panchayat_officer';

export interface Organization {
  id: string;
  name: string;
  type: 'ngo' | 'panchayat' | 'auditor' | 'government';
  contact: {
    email: string;
    phone: string;
    address: string;
  };
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete';
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
}

// Project Types
export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  organizationId: string;
  createdBy: string;
  assignedTo: string[];
  baseline: ProjectBaseline;
  polygons: ProjectPolygon[];
  metadata: ProjectMetadata;
  createdAt: string;
  updatedAt: string;
}

export type ProjectStatus = 'draft' | 'active' | 'completed' | 'suspended' | 'archived';

export interface ProjectBaseline {
  surveyDate: string;
  documents: BaselineDocument[];
  species: SpeciesData[];
  environmentalData: EnvironmentalData;
  socialData: SocialData;
}

export interface BaselineDocument {
  id: string;
  type: 'survey' | 'permit' | 'ownership' | 'environmental_assessment' | 'other';
  name: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  sha256: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface ProjectPolygon {
  id: string;
  name: string;
  type: 'planting_area' | 'buffer_zone' | 'exclusion_area';
  geometry: GeoJSON.Polygon;
  area: number; // in hectares
  plotNumber?: string;
  createdAt: string;
}

export interface ProjectMetadata {
  location: {
    state: string;
    district: string;
    block: string;
    village: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  ecosystem: 'mangrove' | 'seagrass' | 'saltmarsh' | 'other';
  targetSpecies: string[];
  estimatedCarbonSequestration: number;
  projectDuration: number; // in years
  fundingSource: string;
  implementationPartner: string;
}

// Photo and Evidence Types
export interface PhotoRecord {
  id: string;
  projectId: string;
  polygonId?: string;
  localFilePath: string;
  remoteUrl?: string;
  sha256: string;
  fileSize: number;
  mimeType: string;
  exifData: ExifData;
  measurements?: Measurements;
  metadata: PhotoMetadata;
  status: UploadStatus;
  syncAttempts: number;
  createdBy: string;
  createdAt: string;
  uploadedAt?: string;
}

export interface ExifData {
  gps: {
    latitude: number;
    longitude: number;
    altitude?: number;
    accuracy?: number;
  };
  timestamp: string;
  camera: {
    make?: string;
    model?: string;
    orientation?: number;
  };
  technical: {
    width: number;
    height: number;
    fileSize: number;
    iso?: number;
    exposureTime?: string;
    fNumber?: number;
  };
}

export interface Measurements {
  species?: string;
  count?: number;
  survivalRate?: number;
  diameter?: number; // DBH in cm
  height?: number; // in meters
  healthStatus?: 'healthy' | 'stressed' | 'dying' | 'dead';
  notes?: string;
}

export interface PhotoMetadata {
  purpose: 'baseline' | 'monitoring' | 'verification' | 'evidence';
  category: 'planting' | 'growth' | 'maintenance' | 'damage' | 'general';
  description?: string;
  witnessName?: string;
  witnessPhone?: string;
  witnessSignature?: string;
  tags: string[];
}

export type UploadStatus = 'pending' | 'uploading' | 'uploaded' | 'failed' | 'processed';

// Species and Environmental Data
export interface SpeciesData {
  scientificName: string;
  commonName: string;
  localName?: string;
  family: string;
  plantingDensity: number; // plants per hectare
  survivalRate?: number; // percentage
  growthRate?: number; // cm per year
  carbonSequestrationRate?: number; // tons CO2 per hectare per year
}

export interface EnvironmentalData {
  salinity: number; // ppt
  soilPh: number;
  tideRange: number; // meters
  waterDepth?: number; // meters at high tide
  temperature: {
    min: number;
    max: number;
    average: number;
  };
  rainfall: number; // mm per year
  climateZone: string;
}

export interface SocialData {
  communitySize: number;
  households: number;
  primaryLivelihood: string[];
  dependencyOnEcosystem: number; // 1-5 scale
  participationLevel: number; // 1-5 scale
  beneficiaries: {
    direct: number;
    indirect: number;
  };
}

// Sync and Upload Types
export interface SyncJob {
  id: string;
  type: 'photo' | 'document' | 'metadata' | 'project';
  entityId: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  payload: any;
  status: SyncStatus;
  attempts: number;
  maxAttempts: number;
  lastAttemptAt?: string;
  nextAttemptAt?: string;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export type SyncStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface UploadProgress {
  jobId: string;
  fileName: string;
  fileSize: number;
  bytesUploaded: number;
  percentage: number;
  speed: number; // bytes per second
  timeRemaining: number; // seconds
  status: 'starting' | 'uploading' | 'processing' | 'completed' | 'failed';
}

// API Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface PresignedUploadUrl {
  uploadUrl: string;
  fileId: string;
  expiresAt: string;
  fields?: Record<string, string>;
}

// Notification Types
export interface PushNotification {
  id: string;
  title: string;
  body: string;
  type: 'sync_complete' | 'audit_result' | 'system_update' | 'reminder';
  payload?: any;
  receivedAt: string;
  readAt?: string;
}

// Map and GPS Types
export interface GpsCoordinate {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

// Form and Validation Types
export interface FormValidationError {
  field: string;
  message: string;
  code: string;
}

export interface FormState<T> {
  values: T;
  errors: FormValidationError[];
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
}

// App Configuration Types
export interface AppConfig {
  apiBaseUrl: string;
  apiTimeout: number;
  maxFileSize: number;
  maxBatchUploadSize: number;
  uploadRetryAttempts: number;
  syncIntervalMinutes: number;
  gpsAccuracyThreshold: number;
  gpsTimeoutSeconds: number;
  minImageResolution: number;
  imageCompressionQuality: number;
  requireExifData: boolean;
  enableOfflineMode: boolean;
  enableBackgroundSync: boolean;
  enableFileCompression: boolean;
  enableDeviceAttestation: boolean;
  mapboxAccessToken: string;
  encryptionKey: string;
}

// Database Schema Types
export interface DatabaseSchema {
  users: User;
  projects: Project;
  photos: PhotoRecord;
  syncJobs: SyncJob;
  notifications: PushNotification;
  appConfig: AppConfig;
}
