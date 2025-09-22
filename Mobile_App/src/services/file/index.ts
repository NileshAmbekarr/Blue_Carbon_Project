import RNFS from 'react-native-fs';
import ImageResizer from 'react-native-image-resizer';
import CryptoJS from 'crypto-js';
import { Platform, PermissionsAndroid } from 'react-native';

export class FileService {
  private static readonly PHOTOS_DIR = `${RNFS.DocumentDirectoryPath}/photos`;
  private static readonly DOCUMENTS_DIR = `${RNFS.DocumentDirectoryPath}/documents`;
  private static readonly TEMP_DIR = `${RNFS.CachesDirectoryPath}/temp`;

  public static async initialize(): Promise<void> {
    try {
      // Create necessary directories
      await this.ensureDirectoryExists(this.PHOTOS_DIR);
      await this.ensureDirectoryExists(this.DOCUMENTS_DIR);
      await this.ensureDirectoryExists(this.TEMP_DIR);
      
      console.log('✅ File service initialized');
    } catch (error) {
      console.error('❌ File service initialization failed:', error);
      throw error;
    }
  }

  private static async ensureDirectoryExists(path: string): Promise<void> {
    const exists = await RNFS.exists(path);
    if (!exists) {
      await RNFS.mkdir(path);
    }
  }

  // File operations
  public static async savePhoto(
    sourceUri: string,
    fileName: string,
    compress: boolean = true
  ): Promise<{ filePath: string; fileSize: number; sha256: string }> {
    try {
      let processedUri = sourceUri;
      
      // Compress image if requested
      if (compress) {
        const compressed = await ImageResizer.createResizedImage(
          sourceUri,
          1920, // max width
          1080, // max height
          'JPEG',
          80, // quality
          0, // rotation
          undefined, // output path
          false, // keep metadata
          {
            mode: 'contain',
            onlyScaleDown: true,
          }
        );
        processedUri = compressed.uri;
      }

      // Generate unique filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const uniqueFileName = `${timestamp}_${fileName}`;
      const destinationPath = `${this.PHOTOS_DIR}/${uniqueFileName}`;

      // Copy file to app directory
      await RNFS.copyFile(processedUri, destinationPath);

      // Get file stats
      const stats = await RNFS.stat(destinationPath);
      const fileSize = parseInt(stats.size, 10);

      // Generate SHA-256 hash
      const sha256 = await this.generateFileHash(destinationPath);

      // Clean up temporary file if we compressed
      if (compress && processedUri !== sourceUri) {
        try {
          await RNFS.unlink(processedUri);
        } catch (cleanupError) {
          console.warn('Failed to cleanup temp file:', cleanupError);
        }
      }

      return {
        filePath: destinationPath,
        fileSize,
        sha256,
      };
    } catch (error) {
      console.error('❌ Failed to save photo:', error);
      throw error;
    }
  }

  public static async saveDocument(
    sourceUri: string,
    fileName: string
  ): Promise<{ filePath: string; fileSize: number; sha256: string }> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const uniqueFileName = `${timestamp}_${fileName}`;
      const destinationPath = `${this.DOCUMENTS_DIR}/${uniqueFileName}`;

      // Copy file to app directory
      await RNFS.copyFile(sourceUri, destinationPath);

      // Get file stats
      const stats = await RNFS.stat(destinationPath);
      const fileSize = parseInt(stats.size, 10);

      // Generate SHA-256 hash
      const sha256 = await this.generateFileHash(destinationPath);

      return {
        filePath: destinationPath,
        fileSize,
        sha256,
      };
    } catch (error) {
      console.error('❌ Failed to save document:', error);
      throw error;
    }
  }

  public static async readFile(filePath: string): Promise<string> {
    try {
      const exists = await RNFS.exists(filePath);
      if (!exists) {
        throw new Error('File does not exist');
      }

      return await RNFS.readFile(filePath, 'base64');
    } catch (error) {
      console.error('❌ Failed to read file:', error);
      throw error;
    }
  }

  public static async deleteFile(filePath: string): Promise<void> {
    try {
      const exists = await RNFS.exists(filePath);
      if (exists) {
        await RNFS.unlink(filePath);
      }
    } catch (error) {
      console.error('❌ Failed to delete file:', error);
      throw error;
    }
  }

  public static async generateFileHash(filePath: string): Promise<string> {
    try {
      const fileContent = await RNFS.readFile(filePath, 'base64');
      const wordArray = CryptoJS.enc.Base64.parse(fileContent);
      return CryptoJS.SHA256(wordArray).toString();
    } catch (error) {
      console.error('❌ Failed to generate file hash:', error);
      throw error;
    }
  }

  public static async verifyFileIntegrity(filePath: string, expectedHash: string): Promise<boolean> {
    try {
      const actualHash = await this.generateFileHash(filePath);
      return actualHash === expectedHash;
    } catch (error) {
      console.error('❌ Failed to verify file integrity:', error);
      return false;
    }
  }

  // S3 Upload helper
  public static async uploadToS3(presignedUrl: string, fileData: string): Promise<boolean> {
    try {
      const response = await fetch(presignedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/octet-stream',
        },
        body: fileData,
      });

      return response.ok;
    } catch (error) {
      console.error('❌ S3 upload failed:', error);
      return false;
    }
  }

  // Storage management
  public static async getStorageUsage(): Promise<{
    photosSize: number;
    documentsSize: number;
    totalSize: number;
  }> {
    try {
      const [photosSize, documentsSize] = await Promise.all([
        this.getDirectorySize(this.PHOTOS_DIR),
        this.getDirectorySize(this.DOCUMENTS_DIR),
      ]);

      return {
        photosSize,
        documentsSize,
        totalSize: photosSize + documentsSize,
      };
    } catch (error) {
      console.error('❌ Failed to get storage usage:', error);
      return { photosSize: 0, documentsSize: 0, totalSize: 0 };
    }
  }

  private static async getDirectorySize(directoryPath: string): Promise<number> {
    try {
      const exists = await RNFS.exists(directoryPath);
      if (!exists) return 0;

      const items = await RNFS.readDir(directoryPath);
      let totalSize = 0;

      for (const item of items) {
        if (item.isFile()) {
          totalSize += item.size;
        } else if (item.isDirectory()) {
          totalSize += await this.getDirectorySize(item.path);
        }
      }

      return totalSize;
    } catch (error) {
      console.error('❌ Failed to get directory size:', error);
      return 0;
    }
  }

  public static async cleanupOldFiles(maxAgeInDays: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - maxAgeInDays);

      let deletedCount = 0;
      const directories = [this.PHOTOS_DIR, this.DOCUMENTS_DIR, this.TEMP_DIR];

      for (const directory of directories) {
        const items = await RNFS.readDir(directory);
        
        for (const item of items) {
          const modifiedDate = new Date(item.mtime!);
          if (modifiedDate < cutoffDate) {
            try {
              await RNFS.unlink(item.path);
              deletedCount++;
            } catch (deleteError) {
              console.warn(`Failed to delete old file: ${item.path}`, deleteError);
            }
          }
        }
      }

      console.log(`🧹 Cleaned up ${deletedCount} old files`);
      return deletedCount;
    } catch (error) {
      console.error('❌ Failed to cleanup old files:', error);
      return 0;
    }
  }

  // Permissions
  public static async requestStoragePermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message: 'Blue Carbon MRV needs access to storage to save photos and documents.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      return true; // iOS handles permissions differently
    } catch (error) {
      console.error('❌ Failed to request storage permissions:', error);
      return false;
    }
  }

  // File validation
  public static validateImageFile(filePath: string, maxSize: number = 10 * 1024 * 1024): Promise<{
    isValid: boolean;
    error?: string;
    fileSize?: number;
  }> {
    return new Promise(async (resolve) => {
      try {
        const exists = await RNFS.exists(filePath);
        if (!exists) {
          return resolve({ isValid: false, error: 'File does not exist' });
        }

        const stats = await RNFS.stat(filePath);
        const fileSize = parseInt(stats.size, 10);

        if (fileSize > maxSize) {
          return resolve({ 
            isValid: false, 
            error: `File too large: ${(fileSize / 1024 / 1024).toFixed(1)}MB (max: ${(maxSize / 1024 / 1024).toFixed(1)}MB)`,
            fileSize 
          });
        }

        // Check file extension
        const extension = filePath.toLowerCase().split('.').pop();
        const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
        
        if (!extension || !validExtensions.includes(extension)) {
          return resolve({ 
            isValid: false, 
            error: 'Invalid file type. Only image files are allowed.',
            fileSize 
          });
        }

        resolve({ isValid: true, fileSize });
      } catch (error) {
        resolve({ isValid: false, error: 'Failed to validate file' });
      }
    });
  }

  public static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  public static getFileExtension(filePath: string): string {
    return filePath.split('.').pop()?.toLowerCase() || '';
  }

  public static getMimeType(filePath: string): string {
    const extension = this.getFileExtension(filePath);
    
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      bmp: 'image/bmp',
      webp: 'image/webp',
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      csv: 'text/csv',
      txt: 'text/plain',
    };

    return mimeTypes[extension] || 'application/octet-stream';
  }
}

export default FileService;
