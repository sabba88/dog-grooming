'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAction } from 'next-safe-action/hooks'
import { updatePricingSurcharges } from '@/lib/actions/settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { COAT_LABELS, SIZE_LABELS } from '@/lib/types'
import type { UseFormRegister, FieldErrors } from 'react-hook-form'

const MESSAGE = 'La maggiorazione deve essere tra 0% e 500%'

const formSchema = z.object({
  coat_short: z.number().int().min(0, MESSAGE).max(500, MESSAGE),
  coat_medium: z.number().int().min(0, MESSAGE).max(500, MESSAGE),
  coat_long: z.number().int().min(0, MESSAGE).max(500, MESSAGE),
  size_toy: z.number().int().min(0, MESSAGE).max(500, MESSAGE),
  size_small: z.number().int().min(0, MESSAGE).max(500, MESSAGE),
  size_medium: z.number().int().min(0, MESSAGE).max(500, MESSAGE),
  size_large: z.number().int().min(0, MESSAGE).max(500, MESSAGE),
  size_giant: z.number().int().min(0, MESSAGE).max(500, MESSAGE),
})

type FormData = z.infer<typeof formSchema>

type SurchargeRow = {
  field: keyof FormData
  label: string
  dimension: 'coat' | 'size'
  valueKey: string
}

const coatRows: SurchargeRow[] = [
  { field: 'coat_short', label: COAT_LABELS.short, dimension: 'coat', valueKey: 'short' },
  { field: 'coat_medium', label: COAT_LABELS.medium, dimension: 'coat', valueKey: 'medium' },
  { field: 'coat_long', label: COAT_LABELS.long, dimension: 'coat', valueKey: 'long' },
]

const sizeRows: SurchargeRow[] = [
  { field: 'size_toy', label: SIZE_LABELS.toy, dimension: 'size', valueKey: 'toy' },
  { field: 'size_small', label: SIZE_LABELS.small, dimension: 'size', valueKey: 'small' },
  { field: 'size_medium', label: SIZE_LABELS.medium, dimension: 'size', valueKey: 'medium' },
  { field: 'size_large', label: SIZE_LABELS.large, dimension: 'size', valueKey: 'large' },
  { field: 'size_giant', label: SIZE_LABELS.giant, dimension: 'size', valueKey: 'giant' },
]

type PricingSurcharge = {
  dimension: string
  valueKey: string
  surchargePercent: number
}

interface PricingSurchargesEditorProps {
  initialSurcharges: PricingSurcharge[]
}

function buildDefaultValues(surcharges: PricingSurcharge[]): FormData {
  const get = (dim: string, key: string) =>
    surcharges.find((s) => s.dimension === dim && s.valueKey === key)?.surchargePercent ?? 0
  return {
    coat_short: get('coat', 'short'),
    coat_medium: get('coat', 'medium'),
    coat_long: get('coat', 'long'),
    size_toy: get('size', 'toy'),
    size_small: get('size', 'small'),
    size_medium: get('size', 'medium'),
    size_large: get('size', 'large'),
    size_giant: get('size', 'giant'),
  }
}

export function PricingSurchargesEditor({ initialSurcharges }: PricingSurchargesEditorProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: buildDefaultValues(initialSurcharges),
    mode: 'onChange',
  })

  const { execute, isPending } = useAction(updatePricingSurcharges, {
    onSuccess: () => toast.success('Tabelle aggiornate'),
    onError: (error) => toast.error(error.error?.serverError ?? 'Errore durante il salvataggio'),
  })

  function onSubmit(data: FormData) {
    execute({
      surcharges: [
        { dimension: 'coat', valueKey: 'short', surchargePercent: data.coat_short },
        { dimension: 'coat', valueKey: 'medium', surchargePercent: data.coat_medium },
        { dimension: 'coat', valueKey: 'long', surchargePercent: data.coat_long },
        { dimension: 'size', valueKey: 'toy', surchargePercent: data.size_toy },
        { dimension: 'size', valueKey: 'small', surchargePercent: data.size_small },
        { dimension: 'size', valueKey: 'medium', surchargePercent: data.size_medium },
        { dimension: 'size', valueKey: 'large', surchargePercent: data.size_large },
        { dimension: 'size', valueKey: 'giant', surchargePercent: data.size_giant },
      ],
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <SurchargeTable
        title="Maggiorazioni Pelo"
        rows={coatRows}
        register={register}
        errors={errors}
        columnLabel="Tipo Pelo"
      />
      <SurchargeTable
        title="Maggiorazioni Taglia"
        rows={sizeRows}
        register={register}
        errors={errors}
        columnLabel="Taglia"
      />
      <div>
        <Button type="submit" disabled={isPending || !isValid}>
          {isPending && <Loader2 className="size-4 animate-spin mr-2" />}
          Salva
        </Button>
      </div>
    </form>
  )
}

interface SurchargeTableProps {
  title: string
  rows: SurchargeRow[]
  register: UseFormRegister<FormData>
  errors: FieldErrors<FormData>
  columnLabel: string
}

function SurchargeTable({ title, rows, register, errors, columnLabel }: SurchargeTableProps) {
  return (
    <div>
      <h3 className="text-sm font-medium text-foreground mb-3">{title}</h3>
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-2 font-medium text-muted-foreground">{columnLabel}</th>
              <th className="text-left px-4 py-2 font-medium text-muted-foreground">Maggiorazione</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const error = errors[row.field]
              return (
                <tr key={row.field} className="border-t border-border">
                  <td className="px-4 py-2 text-foreground">{row.label}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        max={500}
                        {...register(row.field, { valueAsNumber: true })}
                        className="h-8 w-20"
                        aria-invalid={!!error}
                      />
                      <span className="text-muted-foreground text-sm">%</span>
                    </div>
                    {error && (
                      <p className="text-xs text-destructive mt-1">{error.message}</p>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
