// Database System Exports
// Using simplified types for initial development

// Database service
export { DatabaseService, createDatabaseService, IDatabaseService } from './database-service';

// Export all types from the database service and @carcosa/database
export type {
  User,
  Organization,
  Team,
  TeamMember,
  OrganizationMember,
  Project,
  Bucket,
  File,
  Upload,
  Transform,
  ApiKey,
  AuditLog,
  TeamRole,
  OrganizationRole,
  InvitationStatus,
  CreateUserData,
  UpdateUserData,
  CreateOrganizationData,
  UpdateOrganizationData,
  CreateTeamData,
  UpdateTeamData,
  CreateProjectData,
  UpdateProjectData,
  CreateStorageBucketData,
  UpdateStorageBucketData,
  CreateFileData,
  UpdateFileData,
  CreateUploadData,
  UpdateUploadData,
  CreateTransformData,
  UpdateTransformData,
  CreateAuditLogData,
  AuditLogFilters,
  UserUploadStats,
  OrganizationUploadStats,
  ProjectUploadStats,
  QuotaType
} from './database-service';

// Default export
export { createDatabaseService as default } from './database-service';