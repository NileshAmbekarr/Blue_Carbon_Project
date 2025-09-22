# Blue Carbon MRV Mobile App

A React Native mobile application for ground truth data capture in the Blue Carbon MRV (Monitoring, Reporting, and Verification) ecosystem.

## 🌊 Overview

This mobile app enables NGOs, panchayats, and community teams to:
- Capture geo-tagged photos and videos with EXIF data
- Create and manage project polygons using GeoJSON
- Record field measurements (species count, survival rates, DBH)
- Upload baseline documents and drone imagery
- Work offline with reliable sync capabilities
- Generate tamper-evident evidence through cryptographic hashing

## 🚀 Features

### MVP Features
- **Authentication & RBAC**: JWT-based auth with role-aware UI (NGO, Panchayat, Auditor)
- **Project Management**: Create projects and draw polygons with map integration
- **Camera Capture**: Geo-tagged photos with enforced EXIF and GPS validation
- **Offline Storage**: SQLite-based local storage with sync queue
- **File Uploads**: Presigned S3 uploads with SHA-256 hashing
- **Metadata Forms**: Species tracking, survival counts, and measurements
- **Sync Management**: Background sync with progress tracking

### High Priority Features
- File validation and quality checks
- Baseline document uploads (PDFs, CSVs)
- Resumable uploads for large drone files
- Map-based photo preview with point-in-polygon validation
- Push notifications for audit results
- Tamper-evident metadata display

## 🏗️ Architecture

```
src/
├── components/          # Reusable UI components
├── screens/            # Screen components
├── navigation/         # Navigation configuration
├── services/           # API clients and external services
├── store/              # State management (Zustand)
├── hooks/              # Custom React hooks
├── utils/              # Utility functions and helpers
├── types/              # TypeScript type definitions
└── constants/          # App constants and configuration
```

## 🔧 Setup & Installation

1. **Prerequisites**
   ```bash
   # Install Node.js (>= 16)
   # Install React Native CLI
   npm install -g @react-native-community/cli
   
   # For Android: Install Android Studio & SDK
   # For iOS: Install Xcode & iOS SDK
   ```

2. **Installation**
   ```bash
   cd Mobile_App
   npm install
   
   # Copy environment configuration
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **iOS Setup**
   ```bash
   cd ios && pod install && cd ..
   ```

4. **Android Setup**
   - Ensure Android SDK is properly configured
   - Update `android/local.properties` with SDK path

## 🏃‍♂️ Running the App

```bash
# Start Metro bundler
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

## 📱 Supported Features by Platform

| Feature | Android | iOS |
|---------|---------|-----|
| Camera with EXIF | ✅ | ✅ |
| GPS Location | ✅ | ✅ |
| Background Sync | ✅ | ✅ |
| File Upload | ✅ | ✅ |
| Offline Storage | ✅ | ✅ |
| Push Notifications | ✅ | ✅ |
| Biometric Auth | ✅ | ✅ |

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **File Hashing**: SHA-256 integrity verification
- **EXIF Validation**: Mandatory GPS and timestamp verification
- **Secure Storage**: Encrypted local storage using Keychain/Keystore
- **TLS**: All network communication encrypted
- **Device Attestation**: Optional hardware-backed key verification

## 🌐 Offline Capabilities

- **Local Storage**: SQLite database for offline data persistence
- **Sync Queue**: Reliable background synchronization
- **Conflict Resolution**: Handles data conflicts during sync
- **Resumable Uploads**: Large files can be uploaded in chunks
- **Network Detection**: Automatic sync when connectivity restored

## 🗺️ Map Integration

- **Mapbox/MapLibre**: High-performance map rendering
- **Polygon Drawing**: Interactive polygon creation and editing
- **Offline Tiles**: Cached map tiles for offline use
- **Point-in-Polygon**: Client-side validation for photo locations
- **GeoJSON Export**: Standard format for polygon data

## 📊 Data Model

### Photo Record
```typescript
interface PhotoRecord {
  photoId: string;
  projectId: string;
  filePathLocal: string;
  sha256: string;
  exif: {
    gps: { lat: number; lon: number };
    timestamp: string;
    deviceModel: string;
  };
  measurements: {
    species: string;
    count: number;
    survivalRate?: number;
  };
  status: 'pending' | 'uploading' | 'uploaded' | 'processed';
  createdBy: string;
}
```

### Project Structure
```typescript
interface Project {
  projectId: string;
  name: string;
  description: string;
  polygons: GeoJSON.Polygon[];
  createdBy: string;
  status: 'draft' | 'active' | 'completed';
  baseline: {
    documents: string[];
    surveyData: any;
  };
}
```

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run E2E tests (requires device/emulator)
npm run test:e2e

# Test offline functionality
npm run test:offline
```

## 📦 Build & Release

```bash
# Android Release Build
npm run build:android

# iOS Release Build
npm run build:ios

# Code signing and app store uploads handled separately
```

## 🔧 Configuration

Key configuration options in `.env`:

- **API_BASE_URL**: Backend API endpoint
- **MAPBOX_ACCESS_TOKEN**: Map service token
- **MAX_FILE_SIZE_MB**: Upload size limits
- **GPS_ACCURACY_THRESHOLD**: GPS precision requirements
- **SYNC_INTERVAL_MINUTES**: Background sync frequency

## 📞 Integration Points

- **Backend API**: NestJS backend for metadata and user management
- **S3/IPFS**: File storage with presigned upload URLs
- **Blockchain**: Carbon credit tokenization (via backend)
- **Push Service**: Real-time notifications for audit updates

## 🐛 Troubleshooting

Common issues and solutions:

1. **GPS Permission Issues**: Ensure location permissions are granted
2. **Camera Access**: Check camera permissions and hardware availability
3. **Network Sync Fails**: Verify backend connectivity and auth tokens
4. **Large File Uploads**: Use resumable upload for files > 50MB
5. **Offline Storage Full**: Implement cleanup of synced records

## 📄 License

This project is part of the Blue Carbon MRV ecosystem.

## 🤝 Contributing

1. Follow React Native and TypeScript best practices
2. Write tests for new features
3. Update documentation for API changes
4. Test on both Android and iOS platforms
5. Ensure offline functionality works correctly

## 📞 Support

For technical support or feature requests, contact the Blue Carbon MRV team.
