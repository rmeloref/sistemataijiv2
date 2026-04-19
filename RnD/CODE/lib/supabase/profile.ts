import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

export type UserRole = 'admin' | 'regular'

export type Profile = {
  id: string
  customer_id: string
  role: UserRole
  full_name: string
}

export type Customer = {
  id: string
  name: string
}

export type ProfileWithCustomer = Profile & {
  customer: Customer
}

/**
 * Returns the current user's profile joined with their customer.
 * Returns null if the user is not authenticated or has no profile.
 *
 * Wrapped in React cache() so multiple Server Components in the same
 * render tree can call this without triggering duplicate DB queries.
 */
export const getCurrentProfile = cache(async (): Promise<ProfileWithCustomer | null> => {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('id, customer_id, role, full_name, customer:customers(id, name)')
    .eq('id', user.id)
    .single()

  if (error || !data) return null

  // Supabase returns joined relations as an array — grab the first element
  const customer = Array.isArray(data.customer)
    ? (data.customer[0] as Customer)
    : (data.customer as unknown as Customer)

  if (!customer) return null

  return {
    id: data.id,
    customer_id: data.customer_id,
    role: data.role as UserRole,
    full_name: data.full_name,
    customer,
  }
})
