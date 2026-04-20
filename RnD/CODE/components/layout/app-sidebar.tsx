'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Users, Calendar, TrendingUp, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { ProfileWithCustomer } from '@/lib/supabase/profile'

const navItems = [
  { href: '/dashboard', label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/pacientes', label: 'Pacientes',  icon: Users },
  { href: '/agenda',    label: 'Agenda',     icon: Calendar },
  { href: '/financeiro', label: 'Financeiro', icon: TrendingUp },
]

export function AppSidebar({ profile }: { profile: ProfileWithCustomer | null }) {
  const pathname = usePathname()
  const router   = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-56 h-screen flex flex-col bg-sidebar border-r border-sidebar-border shrink-0">

      {/* Logo */}
      <div className="h-14 flex items-center gap-2.5 px-4 border-b border-sidebar-border">
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <span className="text-primary-foreground text-xs font-bold">太</span>
        </div>
        <span className="text-sm font-semibold text-sidebar-foreground">Sistema Taiji</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href || pathname.startsWith(`${href}/`)

          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User + logout */}
      <div className="p-2 border-t border-sidebar-border space-y-0.5">
        {profile && (
          <div className="px-3 py-2">
            <p className="text-xs font-medium text-sidebar-foreground truncate">
              {profile.full_name || '—'}
            </p>
            <p className="text-xs text-sidebar-foreground/50 truncate">
              {profile.customer.name}
            </p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sair
        </button>
      </div>

    </aside>
  )
}
