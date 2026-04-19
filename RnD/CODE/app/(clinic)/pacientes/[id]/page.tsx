import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getPatientById } from '@/lib/supabase/patients'
import { getAnamnese } from '@/lib/supabase/anamnese'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DadosPessoaisTab } from '@/components/patients/dados-pessoais-tab'
import { DeletePatientButton } from '@/components/patients/delete-patient-button'
import { AnamneseTab } from '@/components/anamnese/anamnese-tab'

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [patient, anamnese] = await Promise.all([
    getPatientById(id),
    getAnamnese(id),
  ])

  if (!patient) notFound()

  const isFeminino = patient.sex === 'feminino'

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">

        {/* Back link */}
        <Link
          href="/pacientes"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Pacientes
        </Link>

        {/* Header row: name + delete */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{patient.full_name}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Cadastrado em {formatDate(patient.created_at.split('T')[0])}
            </p>
          </div>
          <DeletePatientButton patientId={patient.id} />
        </div>

        {/* Tabs — order: Dados Pessoais | Consultas | Anamnese MTC | Evolução */}
        <Tabs defaultValue="dados-pessoais">
          <TabsList className="mb-6">
            <TabsTrigger value="dados-pessoais">Dados Pessoais</TabsTrigger>
            <TabsTrigger value="consultas">Consultas</TabsTrigger>
            <TabsTrigger value="anamnese-mtc">Anamnese MTC</TabsTrigger>
            <TabsTrigger value="evolucao">Evolução</TabsTrigger>
          </TabsList>

          <TabsContent value="dados-pessoais">
            <DadosPessoaisTab patient={patient} />
          </TabsContent>

          <TabsContent value="consultas">
            <div className="rounded-lg border border-border p-6 text-sm text-muted-foreground">
              Em construção
            </div>
          </TabsContent>

          <TabsContent value="anamnese-mtc">
            <AnamneseTab
              patientId={patient.id}
              isFeminino={isFeminino}
              anamnese={anamnese}
            />
          </TabsContent>

          <TabsContent value="evolucao">
            <div className="rounded-lg border border-border p-6 text-sm text-muted-foreground">
              Em construção
            </div>
          </TabsContent>
        </Tabs>

      </div>
    </div>
  )
}
