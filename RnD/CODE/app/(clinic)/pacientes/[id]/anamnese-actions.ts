'use server'

import { revalidatePath } from 'next/cache'
import { upsertAnamnese } from '@/lib/supabase/anamnese'
import { createClient } from '@/lib/supabase/server'
import type { SaudeFeminina } from '@/lib/supabase/anamnese'

export async function saveAnamneseAction(
  patientId: string,
  isFeminino: boolean,
  formData: FormData
) {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('customer_id')
    .eq('id', (await supabase.auth.getUser()).data.user!.id)
    .single()

  if (!profile) return { error: 'Perfil não encontrado.' }

  // Checkboxes — tratamentos anteriores
  const tratamentosOpcoes = [
    'Acupuntura', 'Cirurgia', 'Fisioterapia',
    'Homeopatia', 'Massagem', 'Medicamentos', 'Quiropraxia',
  ]
  const tratamentos_anteriores = tratamentosOpcoes.filter(
    (t) => formData.get(`trat_${t}`) === 'on'
  )

  // Contraindicações booleanas
  const marcapasso      = formData.get('marcapasso')      === 'on'
  const desfibrilador   = formData.get('desfibrilador')   === 'on'
  const gestante_1tri   = formData.get('gestante_1tri')   === 'on'
  const hemofilia       = formData.get('hemofilia')       === 'on'
  const implante_metalico = formData.get('implante_metalico') === 'on'

  // Saúde feminina
  let saude_feminina: SaudeFeminina | null = null
  if (isFeminino) {
    const sfQueixas = [
      'Endometriose', 'Infertilidade primária', 'Infertilidade secundária',
      'Menopausa', 'Menopausa precoce', 'Mioma', 'Perimenopausa',
      'Regulação do ciclo', 'SOP',
    ]
    const sfIntensidade = ['Escasso', 'Normal', 'Abundante', 'Muito abundante']
    const sfAparencia   = ['Vermelho vivo', 'Vermelho escuro', 'Rosado', 'Com coágulos', 'Fluido', 'Espesso']
    const sfDorTipo     = ['Cólica', 'Difusa', 'Pontada', 'Pressão', 'Queimação']
    const sfDorMomento  = ['Menstrual', 'Pré-menstrual', 'Ovulatória', 'Constante']

    saude_feminina = {
      queixa_principal:    sfQueixas.filter((v) => formData.get(`sf_qp_${v}`) === 'on'),
      queixa_outro:        (formData.get('sf_qp_outro') as string) ?? '',
      freq_ciclo:          (formData.get('sf_freq_ciclo') as string) ?? '',
      duracao_fluxo:       (formData.get('sf_duracao_fluxo') as string) ?? '',
      intensidade:         sfIntensidade.filter((v) => formData.get(`sf_int_${v}`) === 'on'),
      aparencia:           sfAparencia.filter((v) => formData.get(`sf_ap_${v}`) === 'on'),
      dor_pelvica:         (formData.get('sf_dor_pelvica') as 'sim' | 'nao' | '') ?? '',
      dor_pelvica_tipo:    sfDorTipo.filter((v) => formData.get(`sf_dt_${v}`) === 'on'),
      dor_pelvica_momento: sfDorMomento.filter((v) => formData.get(`sf_dm_${v}`) === 'on'),
      observacoes:         (formData.get('sf_observacoes') as string) ?? '',
    }
  }

  try {
    await upsertAnamnese({
      patient_id:            patientId,
      customer_id:           profile.customer_id,
      queixa_principal:      (formData.get('queixa_principal')    as string) || null,
      queixas_secundarias:   (formData.get('queixas_secundarias') as string) || null,
      historico_queixa:      (formData.get('historico_queixa')    as string) || null,
      motivo_tratamento:     (formData.get('motivo_tratamento')   as string) || null,
      tratamentos_anteriores,
      tratamento_outro:      (formData.get('tratamento_outro')    as string) || null,
      diabetes:              (formData.get('diabetes')            as 'nao' | 'sim' | 'pre') || null,
      hipertensao:           (formData.get('hipertensao')         as 'nao' | 'sim' | 'controlada') || null,
      marcapasso,
      desfibrilador,
      gestante_1tri,
      hemofilia,
      implante_metalico,
      contra_outro:          (formData.get('contra_outro')        as string) || null,
      alerta_seguranca:      (formData.get('alerta_seguranca')    as string) || null,
      saude_feminina,
    })

    revalidatePath(`/pacientes/${patientId}`)
    return { success: true }
  } catch (err) {
    return { error: 'Erro ao salvar anamnese. Tente novamente.' }
  }
}
