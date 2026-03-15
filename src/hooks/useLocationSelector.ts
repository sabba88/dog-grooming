'use client'

import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'selectedLocationId'
const CHANGE_EVENT = 'location-changed'

interface Location {
  id: string
  name: string
  address: string
}

export function useLocationSelector(locations: Location[]) {
  const [selectedLocationId, setSelectedLocationIdState] = useState<string | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  // Read from localStorage after mount (SSR-safe)
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && locations.some((l) => l.id === stored)) {
      setSelectedLocationIdState(stored)
    } else if (locations.length > 0) {
      // Fallback: select first location if stored one doesn't exist
      setSelectedLocationIdState(locations[0].id)
      localStorage.setItem(STORAGE_KEY, locations[0].id)
    }
    setIsHydrated(true)
  }, [locations])

  // Listen for changes from other hook instances in the same tab
  useEffect(() => {
    const handler = (e: Event) => {
      const id = (e as CustomEvent<string>).detail
      if (id && locations.some((l) => l.id === id)) {
        setSelectedLocationIdState(id)
      }
    }
    window.addEventListener(CHANGE_EVENT, handler)
    return () => window.removeEventListener(CHANGE_EVENT, handler)
  }, [locations])

  const setSelectedLocationId = useCallback(
    (id: string) => {
      setSelectedLocationIdState(id)
      localStorage.setItem(STORAGE_KEY, id)
      window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: id }))
    },
    []
  )

  return {
    selectedLocationId,
    setSelectedLocationId,
    isHydrated,
    locations,
  }
}
