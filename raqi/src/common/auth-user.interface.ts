import { Role } from './roles.enum';

export type AuthUser = {
  sub: string;
  role: Role;
  email?: string;
};
