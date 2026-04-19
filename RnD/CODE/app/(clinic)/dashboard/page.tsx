import { getCurrentProfile } from '@/lib/supabase/profile'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function DashboardPage() {
  const profile = await getCurrentProfile()

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto space-y-6">

        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Bem-vindo, {profile?.full_name || 'Usuário'}
          </p>
        </div>

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
                  <dd className="font-medium text-foreground">{profile.full_name || '—'}</dd>
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
              </dl>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-warning/30 bg-warning/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">⚠ Nenhum perfil encontrado</CardTitle>
              <CardDescription>
                Este usuário ainda não está vinculado a um cliente.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

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
            </ul>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
