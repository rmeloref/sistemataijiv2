import type { UserRole } from '@/lib/supabase/profile'

/**
 * All permissions in the system.
 * Add new ones here as features are built.
 */
export type Permission =
  | 'manage:customer'   // update customer name/settings
  | 'manage:users'      // invite / remove users, change roles
  | 'read:patients'
  | 'write:patients'
  | 'read:sessions'
  | 'write:sessions'
  | 'read:schedule'
  | 'write:schedule'
  | 'read:financial'
  | 'write:financial'
  | 'read:reports'

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'manage:customer',
    'manage:users',
    'read:patients',
    'write:patients',
    'read:sessions',
    'write:sessions',
    'read:schedule',
    'write:schedule',
    'read:financial',
    'write:financial',
    'read:reports',
  ],
  regular: [
    'read:patients',
    'write:patients',
    'read:sessions',
    'write:sessions',
    'read:schedule',
    'write:schedule',
  ],
}

/**
 * Returns true if the given role has the requested permission.
 *
 * Usage (Server Component):
 *   const profile = await getCurrentProfile()
 *   if (!can(profile.role, 'write:financial')) redirect('/dashboard')
 *
 * Usage (client-side rendering gate):
 *   {can(profile.role, 'manage:users') && <InviteUserButton />}
 */
export function can(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission)
}
