import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/supabase/profile'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LogoutButton } from './logout-button'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const profile = await getCurrentProfile()

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-6">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Sistema Taiji</p>
          </div>
          <LogoutButton />
        </div>

        {/* Auth confirmed */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-green-800">
              ✓ Autenticação funcionando
            </CardTitle>
            <CardDescription className="text-green-600">
              Sessão iniciada com sucesso via Supabase Auth
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-1 text-sm">
              <div className="flex gap-2">
                <dt className="text-slate-500 w-16 shrink-0">Email</dt>
                <dd className="font-medium text-slate-900">{user.email}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-slate-500 w-16 shrink-0">ID</dt>
                <dd className="font-mono text-xs text-slate-600 break-all">{user.id}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Profile + customer */}
        {profile ? (
          <Card className="border-primary/20 bg-accent/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-accent-foreground">
                ✓ Perfil e cliente vinculados
              </CardTitle>
              <CardDescription>
                Isolamento de dados multi-tenant ativo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="space-y-1 text-sm">
                <div className="flex gap-2">
                  <dt className="text-muted-foreground w-24 shrink-0">Nome</dt>
                  <dd className="font-medium text-foreground">
                    {profile.full_name || '—'}
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-muted-foreground w-24 shrink-0">Função</dt>
                  <dd>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      profile.role === 'admin'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {profile.role === 'admin' ? 'Administrador' : 'Regular'}
                    </span>
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-muted-foreground w-24 shrink-0">Cliente</dt>
                  <dd className="font-medium text-foreground">{profile.customer.name}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-muted-foreground w-24 shrink-0">Customer ID</dt>
                  <dd className="font-mono text-xs text-muted-foreground break-all">
                    {profile.customer_id}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-warning/30 bg-warning/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-warning">
                ⚠ Nenhum perfil encontrado
              </CardTitle>
              <CardDescription>
                Este usuário ainda não está vinculado a um cliente.
                Execute o SQL de seed no painel do Supabase.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Upcoming features */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Próximas funcionalidades</CardTitle>
            <CardDescription>Será construído nas próximas fases</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
              <li>Gerenciamento de pacientes</li>
              <li>Agenda de sessões</li>
              <li>Módulo financeiro</li>
              <li>CRM de leads</li>
              <li>Módulo saúde da mulher</li>
            </ul>
          </CardContent>
        </Card>

      </div>
    </main>
  )
}
