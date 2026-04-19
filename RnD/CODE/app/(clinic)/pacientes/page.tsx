import { getPatients } from '@/lib/supabase/patients'
import { PatientsList } from '@/components/patients/patients-list'

export default async function PacientesPage() {
  const patients = await getPatients()

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Pacientes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {patients.length} {patients.length === 1 ? 'paciente cadastrado' : 'pacientes cadastrados'}
          </p>
        </div>

        <PatientsList patients={patients} />

      </div>
    </div>
  )
}
