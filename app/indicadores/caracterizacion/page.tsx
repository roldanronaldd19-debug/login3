"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { createClient } from "@/lib/supabase/client"
import { CaracterizacionFiltro } from "@/components/caracterizacion-filtro"
import { CaracterizacionResumen } from "@/components/caracterizacion-resumen"
import { CaracterizacionGraficos } from "@/components/caracterizacion-graficos"
import { CaracterizacionTabla } from "@/components/caracterizacion-tabla"
import {
  calcularEstadisticas,
  calcularDatosTabla,
  calcularDatosGraficos,
  type CaracterizacionRecord,
} from "@/lib/utils/caracterizacion-data"

export default function CaracterizacionPage() {
  const [registros, setRegistros] = useState<CaracterizacionRecord[]>([])
  const [registrosFiltrados, setRegistrosFiltrados] = useState<CaracterizacionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true)

        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          throw new Error("Las variables de entorno de Supabase no están configuradas")
        }

        const supabase = createClient()

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)

        const { data, error: err } = await supabase
          .from("caracterizacion_desechos_daule")
          .select("*")
          .order("fecha_registro", { ascending: false })

        clearTimeout(timeoutId)

        if (err) {
          console.error("[v0] Error de Supabase:", err.message, err.details)
          throw new Error(`Error al cargar datos: ${err.message}`)
        }

        if (!data) {
          console.warn("[v0] No hay datos disponibles")
          setRegistros([])
          setRegistrosFiltrados([])
          setLoading(false)
          return
        }

        const registrosConValores = (data || []).map((r) => ({
          ...r,
          materia_organica_jardin_kg: r.materia_organica_jardin_kg || 0,
          materia_organica_cocina_kg: r.materia_organica_cocina_kg || 0,
          grasas_aceite_comestible_kg: r.grasas_aceite_comestible_kg || 0,
          medicina_jarabe_kg: r.medicina_jarabe_kg || 0,
          medicina_tabletas_kg: r.medicina_tabletas_kg || 0,
          papel_blanco_kg: r.papel_blanco_kg || 0,
          papel_periodico_kg: r.papel_periodico_kg || 0,
          papel_archivo_kg: r.papel_archivo_kg || 0,
          carton_kg: r.carton_kg || 0,
          tetra_brik_kg: r.tetra_brik_kg || 0,
          plastico_pet_kg: r.plastico_pet_kg || 0,
          plastico_mixto_kg: r.plastico_mixto_kg || 0,
          bot_aceite_kg: r.bot_aceite_kg || 0,
          bolsas_kg: r.bolsas_kg || 0,
          vidrio_blanco_kg: r.vidrio_blanco_kg || 0,
          vidrio_verde_kg: r.vidrio_verde_kg || 0,
          vidrio_otros_kg: r.vidrio_otros_kg || 0,
          latas_ferrosas_kg: r.latas_ferrosas_kg || 0,
          aluminio_kg: r.aluminio_kg || 0,
          acero_kg: r.acero_kg || 0,
          metal_otros_kg: r.metal_otros_kg || 0,
          textiles_ropa_kg: r.textiles_ropa_kg || 0,
          caucho_zapatos_neumaticos_kg: r.caucho_zapatos_neumaticos_kg || 0,
          cuero_zapatos_neumaticos_kg: r.cuero_zapatos_neumaticos_kg || 0,
          papel_higienico_kg: r.papel_higienico_kg || 0,
          maderas_kg: r.maderas_kg || 0,
          baterias_tel_lamparas_kg: r.baterias_tel_lamparas_kg || 0,
          electronicos_electrodomesticos_kg: r.electronicos_electrodomesticos_kg || 0,
          escombros_otros_kg: r.escombros_otros_kg || 0,
        }))

        setRegistros(registrosConValores)
        setRegistrosFiltrados(registrosConValores)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Error desconocido"
        console.error("[v0] Error cargando datos:", errorMessage)
        setError(
          `No se pudieron cargar los datos: ${errorMessage}. Verifica que Supabase esté configurado correctamente.`,
        )
      } finally {
        setLoading(false)
      }
    }

    cargarDatos()
  }, [])

  const estadisticas = calcularEstadisticas(registrosFiltrados)
  const { datos: datosTabla, totalDesechos } = calcularDatosTabla(registrosFiltrados)
  const datosGraficos = calcularDatosGraficos(registrosFiltrados)

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow w-full max-w-full px-6 sm:px-8 md:px-10 py-12 lg:py-16">
        <div className="mx-auto">
          <div className="mb-10 border-b-2 border-primary/20 pb-6">
            <h1 className="text-4xl font-bold text-primary-text mb-3">Caracterización de Desechos Sólidos</h1>
            <p className="text-secondary-text text-lg">
              Análisis detallado de los desechos sólidos generados en los hogares del cantón Daule
            </p>
          </div>

          <div className="mb-10 bg-secondary-bg p-8 rounded-lg border border-border">
            {loading ? (
              <p className="text-secondary-text">Cargando datos...</p>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
                <p className="font-medium">{error}</p>
              </div>
            ) : (
              <CaracterizacionFiltro registros={registros} onFiltroChange={setRegistrosFiltrados} />
            )}
          </div>

          {/* Resumen */}
          {!loading && !error && (
            <>
              <div className="mb-12">
                <CaracterizacionResumen {...estadisticas} />
              </div>

              {/* Gráficos */}
              <div className="mb-12">
                <CaracterizacionGraficos datos={datosGraficos} />
              </div>

              {/* Tabla */}
              <div>
                <CaracterizacionTabla datos={datosTabla} totalDesechos={totalDesechos} />
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
