'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FieldTextarea } from './field-textarea'
import { SectionHeading } from './section-heading'
import { CheckboxGroup } from './checkbox-group'
import { saveAnamneseAction } from '@/app/(clinic)/pacientes/[id]/anamnese-actions'
import type { Anamnese, SaudeFeminina } from '@/lib/supabase/anamnese'

// ── constants ────────────────────────────────────────────────────────────────

const TRATAMENTOS = [
  'Acupuntura', 'Cirurgia', 'Fisioterapia',
  'Homeopatia', 'Massagem', 'Medicamentos', 'Quiropraxia',
]

const CONTRA_ITEMS = [
  { name: 'marcapasso',        label: 'Marcapasso' },
  { name: 'desfibrilador',     label: 'Desfibrilador / CDI' },
  { name: 'gestante_1tri',     label: 'Gestante (1º trimestre)' },
  { name: 'hemofilia',         label: 'Hemofilia / distúrbio de coagulação' },
  { name: 'implante_metalico', label: 'Implante metálico na área de tratamento' },
]

const SF_QUEIXAS = [
  'Endometriose', 'Infertilidade primária', 'Infertilidade secundária',
  'Menopausa', 'Menopausa precoce', 'Mioma', 'Perimenopausa',
  'Regulação do ciclo', 'SOP',
]

const SF_INTENSIDADE = ['Escasso', 'Normal', 'Abundante', 'Muito abundante']
const SF_APARENCIA   = ['Vermelho vivo', 'Vermelho escuro', 'Rosado', 'Com coágulos', 'Fluido', 'Espesso']
const SF_DOR_TIPO    = ['Cólica', 'Difusa', 'Pontada', 'Pressão', 'Queimação']
const SF_DOR_MOMENTO = ['Menstrual', 'Pré-menstrual', 'Ovulatória', 'Constante']

// ── helpers ──────────────────────────────────────────────────────────────────

function activeAlerts(anamnese: Anamnese): string[] {
  const map: Record<keyof Pick<Anamnese,
    'marcapasso' | 'desfibrilador' | 'gestante_1tri' | 'hemofilia' | 'implante_metalico'
  >, string> = {
    marcapasso:        'Marcapasso',
    desfibrilador:     'Desfibrilador / CDI',
    gestante_1tri:     'Gestante (1º trimestre)',
    hemofilia:         'Hemofilia / distúrbio de coagulação',
    implante_metalico: 'Implante metálico na área de tratamento',
  }
  return (Object.keys(map) as Array<keyof typeof map>)
    .filter((k) => anamnese[k])
    .map((k) => map[k])
}

// ── view helpers ─────────────────────────────────────────────────────────────

function ReadValue({ value }: { value: string | null | undefined }) {
  return (
    <p className="text-sm text-foreground py-1 whitespace-pre-wrap">
      {value || <span className="text-muted-foreground">—</span>}
    </p>
  )
}

// ── component ────────────────────────────────────────────────────────────────

type Props = {
  patientId: string
  isFeminino: boolean
  anamnese: Anamnese | null
}

export function AnamneseTab({ patientId, isFeminino, anamnese }: Props) {
  const router    = useRouter()
  const [editing, setEditing]   = useState(false)
  const [error,   setError]     = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Track dor_pelvica to conditionally show sub-fields in edit mode
  const [dorPelvica, setDorPelvica] = useState<string>(
    anamnese?.saude_feminina?.dor_pelvica ?? ''
  )

  const alerts = anamnese ? activeAlerts(anamnese) : []
  const sf: SaudeFeminina | null = anamnese?.saude_feminina ?? null

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await saveAnamneseAction(patientId, isFeminino, formData)
      if (result?.error) {
        setError(result.error)
      } else {
        router.refresh()
        setEditing(false)
      }
    })
  }

  return (
    <div className="space-y-1">

      {/* Active alerts banner */}
      {!editing && alerts.length > 0 && (
        <div className="flex gap-2 items-start rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 mb-4">
          <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-destructive">Alertas de segurança</p>
            <ul className="mt-1 text-xs text-destructive/80 space-y-0.5 list-disc list-inside">
              {alerts.map((a) => <li key={a}>{a}</li>)}
            </ul>
            {anamnese?.alerta_seguranca && (
              <p className="mt-1 text-xs text-destructive/80">{anamnese.alerta_seguranca}</p>
            )}
          </div>
        </div>
      )}

      <div className="rounded-lg border border-border p-6 space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Anamnese MTC</h2>
          {!editing ? (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="w-3.5 h-3.5 mr-1.5" />
              Editar
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { setEditing(false); setError(null) }} disabled={isPending}>
                Cancelar
              </Button>
              <Button size="sm" form="anamnese-form" type="submit" disabled={isPending}>
                {isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          )}
        </div>

        <form id="anamnese-form" onSubmit={handleSubmit} className="space-y-8">

          {/* ── 1. Queixas e histórico ─────────────────────────────────── */}
          <div className="space-y-4">
            <SectionHeading title="Queixas e Histórico" />

            {editing ? (
              <>
                <FieldTextarea id="queixa_principal"    name="queixa_principal"    label="Queixa principal"     defaultValue={anamnese?.queixa_principal}    placeholder="Descreva a queixa principal do paciente..." />
                <FieldTextarea id="queixas_secundarias" name="queixas_secundarias" label="Queixas secundárias"  defaultValue={anamnese?.queixas_secundarias} placeholder="Outras queixas relatadas..." />
                <FieldTextarea id="historico_queixa"    name="historico_queixa"    label="Histórico da queixa"  defaultValue={anamnese?.historico_queixa}    placeholder="Evolução, duração, fatores de melhora e piora..." rows={4} />
                <FieldTextarea id="motivo_tratamento"   name="motivo_tratamento"   label="Motivo do tratamento" defaultValue={anamnese?.motivo_tratamento}   placeholder="Por que o paciente busca este tratamento agora?" />
              </>
            ) : (
              <dl className="grid gap-4 text-sm">
                {[
                  { label: 'Queixa principal',    value: anamnese?.queixa_principal },
                  { label: 'Queixas secundárias', value: anamnese?.queixas_secundarias },
                  { label: 'Histórico da queixa', value: anamnese?.historico_queixa },
                  { label: 'Motivo do tratamento', value: anamnese?.motivo_tratamento },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <dt className="text-xs text-muted-foreground mb-0.5">{label}</dt>
                    <ReadValue value={value} />
                  </div>
                ))}
              </dl>
            )}
          </div>

          {/* ── 2. Tratamentos anteriores ──────────────────────────────── */}
          <div className="space-y-4">
            <SectionHeading title="Tratamentos Anteriores" />

            {editing ? (
              <>
                <CheckboxGroup
                  namePrefix="trat"
                  options={TRATAMENTOS.map((t) => ({ label: t, value: t }))}
                  defaultValues={anamnese?.tratamentos_anteriores ?? []}
                />
                <div className="space-y-1.5">
                  <Label htmlFor="tratamento_outro">Outro</Label>
                  <Input id="tratamento_outro" name="tratamento_outro" defaultValue={anamnese?.tratamento_outro ?? ''} placeholder="Especifique..." />
                </div>
              </>
            ) : (
              <div className="text-sm">
                {(anamnese?.tratamentos_anteriores?.length ?? 0) === 0 && !anamnese?.tratamento_outro ? (
                  <span className="text-muted-foreground">—</span>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {(anamnese?.tratamentos_anteriores ?? []).map((t) => (
                      <span key={t} className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground">
                        {t}
                      </span>
                    ))}
                    {anamnese?.tratamento_outro && (
                      <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground">
                        {anamnese.tratamento_outro}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── 3. Condições de saúde ──────────────────────────────────── */}
          <div className="space-y-4">
            <SectionHeading title="Condições de Saúde" />

            {editing ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="diabetes">Diabetes</Label>
                  <select id="diabetes" name="diabetes" defaultValue={anamnese?.diabetes ?? ''}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                    <option value="">Não informado</option>
                    <option value="nao">Não</option>
                    <option value="sim">Sim</option>
                    <option value="pre">Pré-diabetes</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="hipertensao">Hipertensão</Label>
                  <select id="hipertensao" name="hipertensao" defaultValue={anamnese?.hipertensao ?? ''}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                    <option value="">Não informado</option>
                    <option value="nao">Não</option>
                    <option value="sim">Sim</option>
                    <option value="controlada">Controlada</option>
                  </select>
                </div>
              </div>
            ) : (
              <dl className="grid grid-cols-2 gap-4 text-sm">
                {[
                  { label: 'Diabetes',    value: anamnese?.diabetes,    map: { nao: 'Não', sim: 'Sim', pre: 'Pré-diabetes' } },
                  { label: 'Hipertensão', value: anamnese?.hipertensao, map: { nao: 'Não', sim: 'Sim', controlada: 'Controlada' } },
                ].map(({ label, value, map }) => (
                  <div key={label}>
                    <dt className="text-xs text-muted-foreground mb-0.5">{label}</dt>
                    <dd className="font-medium text-foreground">
                      {value ? (map as unknown as Record<string, string>)[value] : <span className="text-muted-foreground font-normal">—</span>}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </div>

          {/* ── 4. Contraindicações e alerta ───────────────────────────── */}
          <div className="space-y-4">
            <SectionHeading title="Contraindicações e Alerta de Segurança" />

            {editing ? (
              <>
                <div className="space-y-2">
                  {CONTRA_ITEMS.map(({ name, label }) => (
                    <label key={name} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        name={name}
                        defaultChecked={!!(anamnese as Record<string, unknown>)?.[name]}
                        className="h-4 w-4 rounded border-input accent-primary"
                      />
                      <span className="text-foreground">{label}</span>
                    </label>
                  ))}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contra_outro">Outra contraindicação</Label>
                  <Input id="contra_outro" name="contra_outro" defaultValue={anamnese?.contra_outro ?? ''} placeholder="Especifique..." />
                </div>
                <FieldTextarea id="alerta_seguranca" name="alerta_seguranca" label="Observações de segurança" defaultValue={anamnese?.alerta_seguranca} placeholder="Informações adicionais relevantes para segurança do atendimento..." />
              </>
            ) : (
              <>
                {alerts.length === 0 && !anamnese?.contra_outro && !anamnese?.alerta_seguranca ? (
                  <p className="text-sm text-muted-foreground">Nenhuma contraindicação registrada.</p>
                ) : (
                  <div className="space-y-3 text-sm">
                    {alerts.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {alerts.map((a) => (
                          <span key={a} className="inline-flex items-center gap-1 rounded-full bg-destructive/10 text-destructive px-2.5 py-0.5 text-xs font-medium">
                            <AlertTriangle className="w-3 h-3" />{a}
                          </span>
                        ))}
                        {anamnese?.contra_outro && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 text-destructive px-2.5 py-0.5 text-xs font-medium">
                            <AlertTriangle className="w-3 h-3" />{anamnese.contra_outro}
                          </span>
                        )}
                      </div>
                    )}
                    {anamnese?.alerta_seguranca && (
                      <div>
                        <dt className="text-xs text-muted-foreground mb-0.5">Observações de segurança</dt>
                        <ReadValue value={anamnese.alerta_seguranca} />
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── 5. Saúde Feminina (só para pacientes do sexo feminino) ─── */}
          {isFeminino && (
            <div className="space-y-4">
              <SectionHeading
                title="Saúde Feminina"
                description="Informações específicas do ciclo e saúde reprodutiva"
              />

              {editing ? (
                <div className="space-y-5">

                  {/* Queixa principal feminina */}
                  <CheckboxGroup
                    label="Queixa principal"
                    namePrefix="sf_qp"
                    options={SF_QUEIXAS.map((v) => ({ label: v, value: v }))}
                    defaultValues={sf?.queixa_principal ?? []}
                  />
                  <div className="space-y-1.5">
                    <Label htmlFor="sf_qp_outro">Outra queixa</Label>
                    <Input id="sf_qp_outro" name="sf_qp_outro" defaultValue={sf?.queixa_outro ?? ''} placeholder="Especifique..." />
                  </div>

                  {/* Ciclo */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="sf_freq_ciclo">Frequência do ciclo</Label>
                      <select id="sf_freq_ciclo" name="sf_freq_ciclo" defaultValue={sf?.freq_ciclo ?? ''}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                        <option value="">Não informado</option>
                        <option value="regular">Regular (26–32 dias)</option>
                        <option value="curto">Ciclo curto (&lt;26 dias)</option>
                        <option value="longo">Ciclo longo (&gt;32 dias)</option>
                        <option value="irregular">Irregular</option>
                        <option value="ausente">Ausente / Amenorreia</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="sf_duracao_fluxo">Duração do fluxo</Label>
                      <select id="sf_duracao_fluxo" name="sf_duracao_fluxo" defaultValue={sf?.duracao_fluxo ?? ''}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                        <option value="">Não informado</option>
                        <option value="curto">Curto (1–2 dias)</option>
                        <option value="normal">Normal (3–5 dias)</option>
                        <option value="longo">Longo (6–7 dias)</option>
                        <option value="muito_longo">Muito longo (&gt;7 dias)</option>
                      </select>
                    </div>
                  </div>

                  <CheckboxGroup
                    label="Intensidade do fluxo"
                    namePrefix="sf_int"
                    options={SF_INTENSIDADE.map((v) => ({ label: v, value: v }))}
                    defaultValues={sf?.intensidade ?? []}
                  />

                  <CheckboxGroup
                    label="Aparência do fluxo"
                    namePrefix="sf_ap"
                    options={SF_APARENCIA.map((v) => ({ label: v, value: v }))}
                    defaultValues={sf?.aparencia ?? []}
                  />

                  {/* Dor pélvica */}
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label>Dor pélvica</Label>
                      <div className="flex gap-4">
                        {['sim', 'nao'].map((v) => (
                          <label key={v} className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                              type="radio"
                              name="sf_dor_pelvica"
                              value={v}
                              defaultChecked={sf?.dor_pelvica === v}
                              onChange={() => setDorPelvica(v)}
                              className="accent-primary"
                            />
                            {v === 'sim' ? 'Sim' : 'Não'}
                          </label>
                        ))}
                      </div>
                    </div>

                    {dorPelvica === 'sim' && (
                      <div className="pl-4 border-l-2 border-border space-y-3">
                        <CheckboxGroup
                          label="Tipo de dor"
                          namePrefix="sf_dt"
                          options={SF_DOR_TIPO.map((v) => ({ label: v, value: v }))}
                          defaultValues={sf?.dor_pelvica_tipo ?? []}
                        />
                        <CheckboxGroup
                          label="Momento da dor"
                          namePrefix="sf_dm"
                          options={SF_DOR_MOMENTO.map((v) => ({ label: v, value: v }))}
                          defaultValues={sf?.dor_pelvica_momento ?? []}
                        />
                      </div>
                    )}
                  </div>

                  <FieldTextarea id="sf_observacoes" name="sf_observacoes" label="Observações" defaultValue={sf?.observacoes} placeholder="Informações adicionais sobre saúde feminina..." />

                </div>
              ) : (
                /* Read mode — saúde feminina */
                <dl className="space-y-4 text-sm">
                  {(sf?.queixa_principal?.length ?? 0) > 0 && (
                    <div>
                      <dt className="text-xs text-muted-foreground mb-1">Queixa principal</dt>
                      <dd className="flex flex-wrap gap-1.5">
                        {sf!.queixa_principal.map((q) => (
                          <span key={q} className="inline-flex rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">{q}</span>
                        ))}
                        {sf?.queixa_outro && (
                          <span className="inline-flex rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">{sf.queixa_outro}</span>
                        )}
                      </dd>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <dt className="text-xs text-muted-foreground mb-0.5">Frequência do ciclo</dt>
                      <dd className="font-medium">{freqLabel(sf?.freq_ciclo) || <span className="text-muted-foreground font-normal">—</span>}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground mb-0.5">Duração do fluxo</dt>
                      <dd className="font-medium">{duracaoLabel(sf?.duracao_fluxo) || <span className="text-muted-foreground font-normal">—</span>}</dd>
                    </div>
                  </div>

                  {(sf?.intensidade?.length ?? 0) > 0 && (
                    <div>
                      <dt className="text-xs text-muted-foreground mb-1">Intensidade do fluxo</dt>
                      <dd className="flex flex-wrap gap-1.5">
                        {sf!.intensidade.map((v) => (
                          <span key={v} className="inline-flex rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">{v}</span>
                        ))}
                      </dd>
                    </div>
                  )}

                  {(sf?.aparencia?.length ?? 0) > 0 && (
                    <div>
                      <dt className="text-xs text-muted-foreground mb-1">Aparência do fluxo</dt>
                      <dd className="flex flex-wrap gap-1.5">
                        {sf!.aparencia.map((v) => (
                          <span key={v} className="inline-flex rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">{v}</span>
                        ))}
                      </dd>
                    </div>
                  )}

                  {sf?.dor_pelvica && (
                    <div>
                      <dt className="text-xs text-muted-foreground mb-0.5">Dor pélvica</dt>
                      <dd>
                        <span className={`font-medium ${sf.dor_pelvica === 'sim' ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {sf.dor_pelvica === 'sim' ? 'Sim' : 'Não'}
                        </span>
                        {sf.dor_pelvica === 'sim' && (
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {[...sf.dor_pelvica_tipo, ...sf.dor_pelvica_momento].map((v) => (
                              <span key={v} className="inline-flex rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">{v}</span>
                            ))}
                          </div>
                        )}
                      </dd>
                    </div>
                  )}

                  {sf?.observacoes && (
                    <div>
                      <dt className="text-xs text-muted-foreground mb-0.5">Observações</dt>
                      <ReadValue value={sf.observacoes} />
                    </div>
                  )}

                  {!sf && <p className="text-muted-foreground">Nenhuma informação registrada.</p>}
                </dl>
              )}
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

        </form>
      </div>
    </div>
  )
}

// ── label helpers ─────────────────────────────────────────────────────────────

function freqLabel(v?: string) {
  const map: Record<string, string> = {
    regular:   'Regular (26–32 dias)',
    curto:     'Ciclo curto (<26 dias)',
    longo:     'Ciclo longo (>32 dias)',
    irregular: 'Irregular',
    ausente:   'Ausente / Amenorreia',
  }
  return v ? map[v] : ''
}

function duracaoLabel(v?: string) {
  const map: Record<string, string> = {
    curto:      'Curto (1–2 dias)',
    normal:     'Normal (3–5 dias)',
    longo:      'Longo (6–7 dias)',
    muito_longo: 'Muito longo (>7 dias)',
  }
  return v ? map[v] : ''
}
