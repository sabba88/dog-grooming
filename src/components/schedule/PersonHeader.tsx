'use client'

import type { StaffStatus } from '@/lib/queries/staff'

interface PersonHeaderProps {
  name: string
  role: 'admin' | 'collaborator'
  status: StaffStatus
  locationName?: string
  startTime?: string
  endTime?: string
}

const STATUS_BG: Record<StaffStatus, string> = {
  active: '#E8F0ED',
  elsewhere: '#FEF3C7',
  unassigned: '#F9FAFB',
}

export function PersonHeader({
  name,
  role,
  status,
  locationName,
  startTime,
  endTime,
}: PersonHeaderProps) {
  const statusLabel =
    status === 'active' && startTime && endTime
      ? `Attivo ${startTime} - ${endTime}`
      : status === 'elsewhere' && locationName
        ? `Presso ${locationName}`
        : status === 'unassigned'
          ? 'Non assegnato'
          : status === 'active'
            ? 'Attivo'
            : ''

  return (
    <div
      className="flex flex-col items-center gap-0.5 p-2 text-center"
      style={{ backgroundColor: STATUS_BG[status] }}
    >
      <span className="text-sm font-medium truncate max-w-full">{name}</span>
      <span className="text-[10px] text-muted-foreground rounded-full bg-muted px-1.5 py-0.5 leading-none">
        {role === 'admin' ? 'Admin' : 'Collab.'}
      </span>
      <span className="text-[11px] text-muted-foreground truncate max-w-full">{statusLabel}</span>
    </div>
  )
}
