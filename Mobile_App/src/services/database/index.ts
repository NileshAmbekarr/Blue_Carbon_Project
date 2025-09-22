import SQLite from 'react-native-sqlite-storage';
import { User, Project, PhotoRecord, SyncJob, PushNotification, AppConfig } from '@types/index';

// Enable promise-based API
SQLite.enablePromise(true);

export class DatabaseService {
  private static instance: DatabaseService;
  private db: SQLite.SQLiteDatabase | null = null;
  private readonly dbName = 'BlueCarbonMRV.db';
  private readonly dbVersion = '1.0';
  private readonly dbDisplayName = 'Blue Carbon MRV Database';

  private constructor() {}

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public async initialize(): Promise<void> {
    try {
      this.db = await SQLite.openDatabase({
        name: this.dbName,
        version: this.dbVersion,
        displayName: this.dbDisplayName,
        location: 'default',
      });

      await this.createTables();
      console.log('✅ Database initialized successfully');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const tables = [
      // Users table
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        username TEXT NOT NULL,
        role TEXT NOT NULL,
        profile TEXT NOT NULL,
        permissions TEXT NOT NULL,
        organization TEXT,
        isActive INTEGER DEFAULT 1,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )`,

      // Projects table
      `CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL,
        organizationId TEXT,
        createdBy TEXT NOT NULL,
        assignedTo TEXT,
        baseline TEXT,
        polygons TEXT NOT NULL,
        metadata TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        syncStatus TEXT DEFAULT 'pending'
      )`,

      // Photos table
      `CREATE TABLE IF NOT EXISTS photos (
        id TEXT PRIMARY KEY,
        projectId TEXT NOT NULL,
        polygonId TEXT,
        localFilePath TEXT NOT NULL,
        remoteUrl TEXT,
        sha256 TEXT NOT NULL,
        fileSize INTEGER NOT NULL,
        mimeType TEXT NOT NULL,
        exifData TEXT NOT NULL,
        measurements TEXT,
        metadata TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        syncAttempts INTEGER DEFAULT 0,
        createdBy TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        uploadedAt TEXT,
        syncStatus TEXT DEFAULT 'pending',
        FOREIGN KEY (projectId) REFERENCES projects (id)
      )`,

      // Sync Jobs table
      `CREATE TABLE IF NOT EXISTS sync_jobs (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        entityId TEXT NOT NULL,
        priority TEXT DEFAULT 'normal',
        payload TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        attempts INTEGER DEFAULT 0,
        maxAttempts INTEGER DEFAULT 3,
        lastAttemptAt TEXT,
        nextAttemptAt TEXT,
        error TEXT,
        createdAt TEXT NOT NULL,
        completedAt TEXT
      )`,

      // Notifications table
      `CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        type TEXT NOT NULL,
        payload TEXT,
        receivedAt TEXT NOT NULL,
        readAt TEXT,
        isRead INTEGER DEFAULT 0
      )`,

      // App Config table
      `CREATE TABLE IF NOT EXISTS app_config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )`,

      // Offline Actions table (for conflict resolution)
      `CREATE TABLE IF NOT EXISTS offline_actions (
        id TEXT PRIMARY KEY,
        action TEXT NOT NULL,
        entityType TEXT NOT NULL,
        entityId TEXT NOT NULL,
        data TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        synced INTEGER DEFAULT 0
      )`,
    ];

    // Create indexes for better performance
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_photos_project ON photos(projectId)',
      'CREATE INDEX IF NOT EXISTS idx_photos_status ON photos(status)',
      'CREATE INDEX IF NOT EXISTS idx_photos_sync_status ON photos(syncStatus)',
      'CREATE INDEX IF NOT EXISTS idx_sync_jobs_status ON sync_jobs(status)',
      'CREATE INDEX IF NOT EXISTS idx_sync_jobs_priority ON sync_jobs(priority)',
      'CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(isRead)',
      'CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status)',
      'CREATE INDEX IF NOT EXISTS idx_offline_actions_synced ON offline_actions(synced)',
    ];

    // Execute table creation
    for (const tableSQL of tables) {
      await this.db.executeSql(tableSQL);
    }

    // Create indexes
    for (const indexSQL of indexes) {
      await this.db.executeSql(indexSQL);
    }

    console.log('✅ Database tables created successfully');
  }

  // User operations
  async saveUser(user: User): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const sql = `INSERT OR REPLACE INTO users 
      (id, email, username, role, profile, permissions, organization, isActive, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    await this.db.executeSql(sql, [
      user.id,
      user.email,
      user.username,
      user.role,
      JSON.stringify(user.profile),
      JSON.stringify(user.permissions),
      JSON.stringify(user.organization),
      user.isActive ? 1 : 0,
      user.createdAt,
      user.updatedAt,
    ]);
  }

  async getUser(userId: string): Promise<User | null> {
    if (!this.db) throw new Error('Database not initialized');

    const sql = 'SELECT * FROM users WHERE id = ?';
    const result = await this.db.executeSql(sql, [userId]);

    if (result[0].rows.length > 0) {
      const row = result[0].rows.item(0);
      return {
        id: row.id,
        email: row.email,
        username: row.username,
        role: row.role,
        profile: JSON.parse(row.profile),
        permissions: JSON.parse(row.permissions),
        organization: row.organization ? JSON.parse(row.organization) : undefined,
        isActive: row.isActive === 1,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      };
    }

    return null;
  }

  // Project operations
  async saveProject(project: Project): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const sql = `INSERT OR REPLACE INTO projects 
      (id, name, description, status, organizationId, createdBy, assignedTo, baseline, polygons, metadata, createdAt, updatedAt, syncStatus)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    await this.db.executeSql(sql, [
      project.id,
      project.name,
      project.description,
      project.status,
      project.organizationId,
      project.createdBy,
      JSON.stringify(project.assignedTo),
      JSON.stringify(project.baseline),
      JSON.stringify(project.polygons),
      JSON.stringify(project.metadata),
      project.createdAt,
      project.updatedAt,
      'pending', // Default sync status
    ]);
  }

  async getProjects(): Promise<Project[]> {
    if (!this.db) throw new Error('Database not initialized');

    const sql = 'SELECT * FROM projects ORDER BY updatedAt DESC';
    const result = await this.db.executeSql(sql);

    const projects: Project[] = [];
    for (let i = 0; i < result[0].rows.length; i++) {
      const row = result[0].rows.item(i);
      projects.push({
        id: row.id,
        name: row.name,
        description: row.description,
        status: row.status,
        organizationId: row.organizationId,
        createdBy: row.createdBy,
        assignedTo: JSON.parse(row.assignedTo),
        baseline: JSON.parse(row.baseline),
        polygons: JSON.parse(row.polygons),
        metadata: JSON.parse(row.metadata),
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      });
    }

    return projects;
  }

  async getProject(projectId: string): Promise<Project | null> {
    if (!this.db) throw new Error('Database not initialized');

    const sql = 'SELECT * FROM projects WHERE id = ?';
    const result = await this.db.executeSql(sql, [projectId]);

    if (result[0].rows.length > 0) {
      const row = result[0].rows.item(0);
      return {
        id: row.id,
        name: row.name,
        description: row.description,
        status: row.status,
        organizationId: row.organizationId,
        createdBy: row.createdBy,
        assignedTo: JSON.parse(row.assignedTo),
        baseline: JSON.parse(row.baseline),
        polygons: JSON.parse(row.polygons),
        metadata: JSON.parse(row.metadata),
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      };
    }

    return null;
  }

  // Photo operations
  async savePhoto(photo: PhotoRecord): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const sql = `INSERT OR REPLACE INTO photos 
      (id, projectId, polygonId, localFilePath, remoteUrl, sha256, fileSize, mimeType, 
       exifData, measurements, metadata, status, syncAttempts, createdBy, createdAt, uploadedAt, syncStatus)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    await this.db.executeSql(sql, [
      photo.id,
      photo.projectId,
      photo.polygonId || null,
      photo.localFilePath,
      photo.remoteUrl || null,
      photo.sha256,
      photo.fileSize,
      photo.mimeType,
      JSON.stringify(photo.exifData),
      JSON.stringify(photo.measurements),
      JSON.stringify(photo.metadata),
      photo.status,
      photo.syncAttempts,
      photo.createdBy,
      photo.createdAt,
      photo.uploadedAt || null,
      'pending', // Default sync status
    ]);
  }

  async getPhotos(projectId?: string, status?: string): Promise<PhotoRecord[]> {
    if (!this.db) throw new Error('Database not initialized');

    let sql = 'SELECT * FROM photos';
    const params: any[] = [];

    const conditions: string[] = [];
    if (projectId) {
      conditions.push('projectId = ?');
      params.push(projectId);
    }
    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY createdAt DESC';

    const result = await this.db.executeSql(sql, params);

    const photos: PhotoRecord[] = [];
    for (let i = 0; i < result[0].rows.length; i++) {
      const row = result[0].rows.item(i);
      photos.push({
        id: row.id,
        projectId: row.projectId,
        polygonId: row.polygonId,
        localFilePath: row.localFilePath,
        remoteUrl: row.remoteUrl,
        sha256: row.sha256,
        fileSize: row.fileSize,
        mimeType: row.mimeType,
        exifData: JSON.parse(row.exifData),
        measurements: JSON.parse(row.measurements),
        metadata: JSON.parse(row.metadata),
        status: row.status,
        syncAttempts: row.syncAttempts,
        createdBy: row.createdBy,
        createdAt: row.createdAt,
        uploadedAt: row.uploadedAt,
      });
    }

    return photos;
  }

  async updatePhotoStatus(photoId: string, status: string, remoteUrl?: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const sql = `UPDATE photos SET status = ?, remoteUrl = ?, uploadedAt = ? WHERE id = ?`;
    const uploadedAt = status === 'uploaded' ? new Date().toISOString() : null;

    await this.db.executeSql(sql, [status, remoteUrl || null, uploadedAt, photoId]);
  }

  // Sync Job operations
  async addSyncJob(job: SyncJob): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const sql = `INSERT INTO sync_jobs 
      (id, type, entityId, priority, payload, status, attempts, maxAttempts, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    await this.db.executeSql(sql, [
      job.id,
      job.type,
      job.entityId,
      job.priority,
      JSON.stringify(job.payload),
      job.status,
      job.attempts,
      job.maxAttempts,
      job.createdAt,
    ]);
  }

  async getPendingSyncJobs(): Promise<SyncJob[]> {
    if (!this.db) throw new Error('Database not initialized');

    const sql = `SELECT * FROM sync_jobs 
      WHERE status IN ('pending', 'failed') 
      ORDER BY priority DESC, createdAt ASC`;

    const result = await this.db.executeSql(sql);

    const jobs: SyncJob[] = [];
    for (let i = 0; i < result[0].rows.length; i++) {
      const row = result[0].rows.item(i);
      jobs.push({
        id: row.id,
        type: row.type,
        entityId: row.entityId,
        priority: row.priority,
        payload: JSON.parse(row.payload),
        status: row.status,
        attempts: row.attempts,
        maxAttempts: row.maxAttempts,
        lastAttemptAt: row.lastAttemptAt,
        nextAttemptAt: row.nextAttemptAt,
        error: row.error,
        createdAt: row.createdAt,
        completedAt: row.completedAt,
      });
    }

    return jobs;
  }

  async updateSyncJobStatus(
    jobId: string, 
    status: string, 
    error?: string, 
    attempts?: number
  ): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    const completedAt = status === 'completed' ? now : null;

    const sql = `UPDATE sync_jobs 
      SET status = ?, error = ?, attempts = ?, lastAttemptAt = ?, completedAt = ? 
      WHERE id = ?`;

    await this.db.executeSql(sql, [
      status,
      error || null,
      attempts || 0,
      now,
      completedAt,
      jobId,
    ]);
  }

  // Notification operations
  async saveNotification(notification: PushNotification): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const sql = `INSERT OR REPLACE INTO notifications 
      (id, title, body, type, payload, receivedAt, readAt, isRead)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    await this.db.executeSql(sql, [
      notification.id,
      notification.title,
      notification.body,
      notification.type,
      JSON.stringify(notification.payload),
      notification.receivedAt,
      notification.readAt || null,
      notification.readAt ? 1 : 0,
    ]);
  }

  async getNotifications(unreadOnly: boolean = false): Promise<PushNotification[]> {
    if (!this.db) throw new Error('Database not initialized');

    let sql = 'SELECT * FROM notifications';
    if (unreadOnly) {
      sql += ' WHERE isRead = 0';
    }
    sql += ' ORDER BY receivedAt DESC';

    const result = await this.db.executeSql(sql);

    const notifications: PushNotification[] = [];
    for (let i = 0; i < result[0].rows.length; i++) {
      const row = result[0].rows.item(i);
      notifications.push({
        id: row.id,
        title: row.title,
        body: row.body,
        type: row.type,
        payload: row.payload ? JSON.parse(row.payload) : undefined,
        receivedAt: row.receivedAt,
        readAt: row.readAt,
      });
    }

    return notifications;
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const sql = 'UPDATE notifications SET isRead = 1, readAt = ? WHERE id = ?';
    await this.db.executeSql(sql, [new Date().toISOString(), notificationId]);
  }

  // Utility operations
  async clearAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const tables = ['users', 'projects', 'photos', 'sync_jobs', 'notifications', 'app_config', 'offline_actions'];
    
    for (const table of tables) {
      await this.db.executeSql(`DELETE FROM ${table}`);
    }
  }

  async getStorageSize(): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    // Get total size of all photos
    const result = await this.db.executeSql('SELECT SUM(fileSize) as totalSize FROM photos');
    return result[0].rows.item(0).totalSize || 0;
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
      console.log('✅ Database connection closed');
    }
  }
}

export default DatabaseService;
