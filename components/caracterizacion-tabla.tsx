import { Card } from "@/components/ui/card"
import React from "react"

interface CaracterizacionTablaProps {
  datos: {
    categoria: string
    subcategoria?: string
    peso: number
    porcentaje: number
    esTotal?: boolean
    esSubcategoria?: boolean
  }[]
  totalDesechos: number
}

export function CaracterizacionTabla({ datos, totalDesechos }: CaracterizacionTablaProps) {
  /* Reorganizar estructura: categoría principal sin datos, luego subcategorías, luego total categoría */
  const tablasAgrupadas: Array<{
    categoria: string
    subcategorias: Array<{
      label: string
      peso: number
      porcentaje: number
    }>
    totalCategoria: number
    totalPorcentaje: number
  }> = []

  let indice = 0
  while (indice < datos.length) {
    const subcatsList: Array<{ label: string; peso: number; porcentaje: number }> = []
    let totalCat = 0
    let totalPct = 0
    let categoriaActual = ""

    // Recolectar todas las subcategorías de una categoría
    while (indice < datos.length && !datos[indice].esTotal) {
      if (datos[indice].subcategoria) {
        subcatsList.push({
          label: datos[indice].subcategoria,
          peso: datos[indice].peso,
          porcentaje: datos[indice].porcentaje,
        })
      }
      indice++
    }

    // El siguiente elemento es el total de la categoría
    if (indice < datos.length && datos[indice].esTotal) {
      categoriaActual = datos[indice].categoria
      totalCat = datos[indice].peso
      totalPct = datos[indice].porcentaje
      indice++
    }

    if (subcatsList.length > 0) {
      tablasAgrupadas.push({
        categoria: categoriaActual,
        subcategorias: subcatsList,
        totalCategoria: totalCat,
        totalPorcentaje: totalPct,
      })
    }
  }

  return (
    <Card className="p-8 border border-border overflow-x-auto">
      <div className="mb-6 border-b-2 border-accent pb-4">
        <h3 className="text-2xl font-bold text-foreground flex items-center gap-2">Tablas Resumen por Categorías</h3>
      </div>

      <h4 className="text-lg font-semibold text-foreground mb-6">Distribución por Categorías de Desechos</h4>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-foreground/20">
              <th className="text-left py-4 px-4 font-semibold text-foreground">Categoría / Subcategoría</th>
              <th className="text-right py-4 px-4 font-semibold text-foreground">Peso (kg)</th>
              <th className="text-right py-4 px-4 font-semibold text-foreground">% del Total</th>
            </tr>
          </thead>
          <tbody>
            {tablasAgrupadas.map((grupo, idx) => (
              <React.Fragment key={idx}>
                {/* Fila de Categoría Principal - sin datos */}
                <tr className="bg-primary-lighter/40 border-b border-foreground/10">
                  <td className="py-3 px-4 font-bold text-foreground text-base">{grupo.categoria}</td>
                  <td className="text-right py-3 px-4"></td>
                  <td className="text-right py-3 px-4"></td>
                </tr>

                {/* Filas de Subcategorías */}
                {grupo.subcategorias.map((sub, subIdx) => (
                  <tr
                    key={`${idx}-${subIdx}`}
                    className="border-b border-foreground/5 hover:bg-secondary-bg/30 transition-colors"
                  >
                    <td className="py-3 px-4 text-foreground/70 pl-12">{sub.label}</td>
                    <td className="text-right py-3 px-4 text-foreground font-medium">{sub.peso.toFixed(2)}</td>
                    <td className="text-right py-3 px-4 text-accent font-medium">{sub.porcentaje.toFixed(2)}%</td>
                  </tr>
                ))}

                {/* Fila de Total de Categoría - con fondo teal claro */}
                <tr className="bg-accent-lighter/50 border-b-2 border-accent/30 font-semibold">
                  <td className="py-3 px-4 text-foreground pl-4">TOTAL {grupo.categoria}</td>
                  <td className="text-right py-3 px-4 text-foreground">{grupo.totalCategoria.toFixed(2)}</td>
                  <td className="text-right py-3 px-4 text-accent">{grupo.totalPorcentaje.toFixed(2)}%</td>
                </tr>
              </React.Fragment>
            ))}

            {/* Fila Final de Total General */}
            <tr className="bg-primary-lighter border-t-2 border-primary/30 font-bold text-base">
              <td className="py-5 px-4 text-foreground">TOTAL GENERAL</td>
              <td className="text-right py-5 px-4 text-foreground">{totalDesechos.toFixed(2)}</td>
              <td className="text-right py-5 px-4 text-primary">100.00%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  )
}
