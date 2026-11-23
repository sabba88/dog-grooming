'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { loginSchema, type LoginFormData } from '@/lib/validations/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
  })

  async function onSubmit(data: LoginFormData) {
    setError(null)
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        username: data.username,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        setError('Credenziali non valide')
      } else {
        router.push('/bookings')
        router.refresh()
      }
    } catch {
      setError('Credenziali non valide')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="flex w-full max-w-sm flex-col gap-5">
        <div className="flex items-center justify-center rounded-xl border border-border bg-card p-4 shadow-xs">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-baum-house.webp"
            alt="Baum House"
            className="h-14 w-auto object-contain"
          />
        </div>

        <Card className="shadow-md">
          <CardHeader className="gap-1 text-center">
            <CardTitle className="text-xl font-medium">Accedi</CardTitle>
            <CardDescription>Gestionale della toelettatura</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Il tuo username"
                  {...register('username')}
                  className="min-h-[44px]"
                />
                {errors.username && (
                  <p className="text-sm text-destructive">{errors.username.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="La tua password"
                  {...register('password')}
                  className="min-h-[44px]"
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>

              {error && (
                <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-center text-sm font-medium text-destructive">
                  {error}
                </p>
              )}

              <Button type="submit" className="min-h-[44px] w-full" disabled={isLoading}>
                {isLoading ? 'Accesso in corso...' : 'Accedi'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
