export enum Role {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  RESIDENT = 'resident',
  MAINTENANCE = 'maintenance',
  PRESIDENT = 'president',
  SECURITY = 'security',
  TREASURER = 'treasurer',
}

export enum Action {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
}

export enum Resource {
  MAINTENANCE = 'maintenance',
  PRESIDENT = 'president',
  SECURITY = 'security',
  TREASURER = 'treasurer',
}
