'use client'

import type { StaffStatus, ShiftInfo } from '@/lib/queries/staff'

interface PersonHeaderProps {
  name: string
  role: 'admin' | 'collaborator'
  overallStatus: StaffStatus
  shifts: ShiftInfo[]
}

const STATUS_BG: Record<StaffStatus, string> = {
  active: '#E5F7F9',
  elsewhere: '#FEF3C7',
  unassigned: '#F9FAFB',
}

function getStatusLabel(overallStatus: StaffStatus, shifts: ShiftInfo[]): string {
  if (overallStatus === 'unassigned') return 'Non assegnato'
  if (overallStatus === 'elsewhere') {
    const elsewhereShift = shifts.find(s => s.status === 'elsewhere')
    return elsewhereShift?.locationName ? `Presso ${elsewhereShift.locationName}` : 'Altrove'
  }
  const activeShifts = shifts.filter(s => s.status === 'active')
  if (activeShifts.length === 0) return 'Attivo'
  return activeShifts.map(s => `${s.startTime}-${s.endTime}`).join(' • ')
}

export function PersonHeader({ name, role, overallStatus, shifts }: PersonHeaderProps) {
  const statusLabel = getStatusLabel(overallStatus, shifts)

  return (
    <div
      className="flex flex-col items-center gap-0.5 p-2 text-center"
      style={{ backgroundColor: STATUS_BG[overallStatus] }}
    >
      <span className="text-sm font-medium truncate max-w-full">{name}</span>
      <span className="text-[10px] text-muted-foreground rounded-full bg-muted px-1.5 py-0.5 leading-none">
        {role === 'admin' ? 'Admin' : 'Collab.'}
      </span>
      <span className="text-[11px] text-muted-foreground truncate max-w-full">{statusLabel}</span>
    </div>
  )
}
