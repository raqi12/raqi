export enum Role {
  Admin = 'admin',
  Manager = 'manager',
  Supervisor = 'supervisor',
  Driver = 'driver',
  Customer = 'customer',
}

/** Staff roles that can access the admin dashboard APIs. */
export const STAFF_ROLES: Role[] = [Role.Admin, Role.Manager, Role.Supervisor];

export function isStaffRole(role: Role | string): boolean {
  return STAFF_ROLES.includes(role as Role);
}
