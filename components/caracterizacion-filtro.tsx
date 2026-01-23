"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import type { CaracterizacionRecord } from "@/lib/utils/caracterizacion-data"

interface CaracterizacionFiltroProps {
  registros: CaracterizacionRecord[]
  onFiltroChange: (registrosFiltrados: CaracterizacionRecord[]) => void
}

export function CaracterizacionFiltro({ registros, onFiltroChange }: CaracterizacionFiltroProps) {
  const [lugares, setLugares] = useState<string[]>([])
  const [lugarSeleccionado, setLugarSeleccionado] = useState<string>("todos")

  useEffect(() => {
    const lugaresUnicos = Array.from(new Set(registros.map((r) => r.lugar))).sort()
    setLugares(lugaresUnicos)
  }, [registros])

  useEffect(() => {
    if (lugarSeleccionado === "todos") {
      onFiltroChange(registros)
    } else {
      onFiltroChange(registros.filter((r) => r.lugar === lugarSeleccionado))
    }
  }, [lugarSeleccionado, registros, onFiltroChange])

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="lugar-select" className="text-primary-text font-semibold">
        Filtrar por Ubicación
      </Label>
      <Select value={lugarSeleccionado} onValueChange={setLugarSeleccionado}>
        <SelectTrigger
          id="lugar-select"
          className="w-full md:w-64 bg-white border-2 border-border hover:border-primary transition-colors"
        >
          <SelectValue placeholder="Selecciona una ubicación" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todas las ubicaciones ({registros.length})</SelectItem>
          {lugares.map((lugar) => (
            <SelectItem key={lugar} value={lugar}>
              {lugar}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
