'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CalendarDays } from 'lucide-react'
import { StaffCalendarEditor } from './StaffCalendarEditor'

interface Assignment {
  id: string
  userId: string
  locationId: string
  locationName: string | null
  date: string
  startTime: string
  endTime: string
}

interface StaffUser {
  id: string
  name: string
  email: string
  role: 'admin' | 'collaborator'
  assignments: Assignment[]
}

interface Location {
  id: string
  name: string
}

interface StaffListProps {
  users: StaffUser[]
  locations: Location[]
}

export function StaffList({ users, locations }: StaffListProps) {
  const router = useRouter()
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<StaffUser | null>(null)

  function handleEditCalendar(user: StaffUser) {
    setSelectedUser(user)
    setCalendarOpen(true)
  }

  function handleSuccess() {
    router.refresh()
  }

  function getShiftsSummary(user: StaffUser) {
    const uniqueDates = new Set(user.assignments.map(a => a.date))
    const count = uniqueDates.size
    if (count === 0) {
      return (
        <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200 text-xs">
          Nessun turno
        </Badge>
      )
    }
    return (
      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 text-xs">
        {count} {count === 1 ? 'giorno' : 'giorni'}
      </Badge>
    )
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">Nessun utente attivo</p>
      </div>
    )
  }

  return (
    <>
      {/* Desktop: Table */}
      <div className="hidden md:block rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Ruolo</TableHead>
              <TableHead>Turni configurati</TableHead>
              <TableHead className="text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs">
                    {user.role === 'admin' ? 'Admin' : 'Collaboratore'}
                  </Badge>
                </TableCell>
                <TableCell>{getShiftsSummary(user)}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditCalendar(user)}
                    aria-label={`Modifica calendario ${user.name}`}
                  >
                    <CalendarDays className="h-4 w-4 mr-1" />
                    Calendario
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: Cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {users.map((user) => (
          <div
            key={user.id}
            className="rounded-lg border border-border bg-card p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-medium text-foreground">{user.name}</p>
                <p className="text-xs text-muted-foreground">
                  {user.role === 'admin' ? 'Amministratore' : 'Collaboratore'}
                </p>
              </div>
              {getShiftsSummary(user)}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEditCalendar(user)}
              className="w-full"
            >
              <CalendarDays className="h-4 w-4 mr-1" />
              Modifica Calendario
            </Button>
          </div>
        ))}
      </div>

      {selectedUser && (
        <StaffCalendarEditor
          key={selectedUser.id}
          open={calendarOpen}
          onOpenChange={setCalendarOpen}
          onSuccess={handleSuccess}
          user={selectedUser}
          locations={locations}
          existingAssignments={selectedUser.assignments}
        />
      )}
    </>
  )
}
