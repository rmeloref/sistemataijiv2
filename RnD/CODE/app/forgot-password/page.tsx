'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const schema = z.object({
  email: z.string().email('Email inválido'),
})

type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    const supabase = createClient()

    // Always show the success screen — never confirm whether the email exists
    await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    })

    setSubmitted(true)
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm px-4">

        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary mb-4">
            <span className="text-primary-foreground font-bold text-lg">太</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Sistema Taiji
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Plataforma de gestão clínica
          </p>
        </div>

        <Card className="shadow-sm">
          {!submitted ? (
            <>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Redefinir senha</CardTitle>
                <CardDescription>
                  Digite seu email e enviaremos um link para criar uma nova senha
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      autoComplete="email"
                      autoFocus
                      aria-invalid={!!errors.email}
                      {...register('email')}
                    />
                    {errors.email && (
                      <p className="text-xs text-destructive">{errors.email.message}</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? 'Enviando…' : 'Enviar link de redefinição'}
                  </Button>

                  <div className="text-center">
                    <Link
                      href="/login"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      ← Voltar para o login
                    </Link>
                  </div>

                </form>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Verifique seu email</CardTitle>
                <CardDescription>
                  Se esse endereço estiver cadastrado, você receberá um link de
                  redefinição em instantes. Confira também sua pasta de spam.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/login">
                  <Button variant="outline" className="w-full">
                    ← Voltar para o login
                  </Button>
                </Link>
              </CardContent>
            </>
          )}
        </Card>

      </div>
    </main>
  )
}
