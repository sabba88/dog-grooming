'use client'

import { useCallback, useSyncExternalStore } from 'react'

const STORAGE_KEY = 'selectedLocationId'
const CHANGE_EVENT = 'location-changed'

interface Location {
  id: string
  name: string
  address: string
}

// localStorage piu' l'evento custom sono a tutti gli effetti uno store esterno:
// useSyncExternalStore lo legge senza passare da un effect e senza mismatch di
// idratazione, perche' sul server la snapshot e' null come prima del mount.
function subscribe(onStoreChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onStoreChange)
  // Altre schede: scrivono localStorage senza passare dall'evento custom.
  window.addEventListener('storage', onStoreChange)
  return () => {
    window.removeEventListener(CHANGE_EVENT, onStoreChange)
    window.removeEventListener('storage', onStoreChange)
  }
}

function getStoredLocationId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

const noStoredLocationId = () => null
const onClient = () => true
const onServer = () => false

export function useLocationSelector(locations: Location[]) {
  const storedLocationId = useSyncExternalStore(subscribe, getStoredLocationId, noStoredLocationId)
  const isHydrated = useSyncExternalStore(subscribe, onClient, onServer)

  // La sede memorizzata vale solo se esiste ancora tra quelle disponibili,
  // altrimenti si ripiega sulla prima.
  const storedIsValid = !!storedLocationId && locations.some((l) => l.id === storedLocationId)
  const selectedLocationId = (storedIsValid ? storedLocationId : locations[0]?.id) ?? null

  const setSelectedLocationId = useCallback((id: string) => {
    localStorage.setItem(STORAGE_KEY, id)
    // Notifica le altre istanze dell'hook nella stessa scheda.
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: id }))
  }, [])

  return {
    selectedLocationId,
    setSelectedLocationId,
    isHydrated,
    locations,
  }
}
