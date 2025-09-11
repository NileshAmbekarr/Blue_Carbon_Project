export enum UserRole {
  ADMIN = 'admin',           // NCCR - Full system access
  AUDITOR = 'auditor',       // Third-party auditors - Review and verify MRV reports
  DEVELOPER = 'developer',   // NGOs/Panchayats - Create projects, upload data
  PUBLIC = 'public',         // General public - Read-only access to transparency portal
}

export enum ProjectStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  SUSPENDED = 'suspended',
  REJECTED = 'rejected',
}

export enum CreditStatus {
  PENDING = 'pending',
  ISSUED = 'issued',
  RETIRED = 'retired',
  REVOKED = 'revoked',
}

export enum OrganizationType {
  NGO = 'ngo',
  PANCHAYAT = 'panchayat',
  GOVERNMENT = 'government',
  PRIVATE = 'private',
}

export enum FileType {
  PHOTO = 'photo',
  DRONE = 'drone',
  SATELLITE = 'satellite',
  PDF = 'pdf',
  BASELINE_DOC = 'baseline_doc',
  MRV_REPORT = 'mrv_report',
}

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  APPROVE = 'approve',
  REJECT = 'reject',
  SUBMIT = 'submit',
  VERIFY = 'verify',
}
