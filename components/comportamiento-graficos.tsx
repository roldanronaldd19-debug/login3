"use client"

import { useState } from "react"
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ResponsiveContainer,
} from "recharts"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface GraficosProps {
  datos: any[]
}

const COLORS = [
  "#10b981",
  "#059669",
  "#14b8a6",
  "#0d9488",
  "#06b6d4",
  "#0891b2",
  "#0ea5e9",
  "#0284c7",
  "#3b82f6",
  "#2563eb",
  "#6366f1",
  "#4f46e5",
  "#8b5cf6",
  "#7c3aed",
  "#a855f7",
]

const SECCIONES = {
  "distribucion-demografica": {
    titulo: "Distribución Demográfica",
    grupos: {
      "estado-civil": {
        nombre: "Estado Civil",
        campo: "estado_civil",
        valores: ["casado", "soltero", "divorciado", "viudo", "unión libre", "separado"],
      },
      "nivel-educativo": {
        nombre: "Nivel Educativo",
        campo: "educacion_jefe_hogar",
        valores: ["primaria", "secundaria", "universidad", "postgrado"],
      },
      "situacion-laboral": {
        nombre: "Situación Laboral",
        campo: "situacion_laboral_jefe_hogar",
        valores: ["temporal", "desempleado", "empleado"],
      },
      "ingreso-mensual": {
        nombre: "Ingreso Mensual",
        campo: "ingreso_mensual_jefe_hogar",
        valores: ["mayor al sueldo básico", "menor al sueldo básico", "sueldo básico"],
      },
      "tipo-hogar": {
        nombre: "Tipo de Hogar",
        campo: "tipo_hogar",
        valores: ["alquilada", "prestada", "propia"],
      },
    },
  },
  "determinantes-socioculturales": {
    titulo: "Determinantes Socioculturales",
    grupos: {
      "conoce-desechos": {
        nombre: "¿Conoce qué son los desechos sólidos domiciliarios?",
        campo: "conoce_desechos_solidos",
        valores: ["totalmente desacuerdo", "desacuerdo", "indiferente", "de acuerdo", "totalmente de acuerdo"],
      },
      "comportamiento-adecuado": {
        nombre: "¿Existe comportamiento adecuado en el manejo?",
        campo: "cree_comportamiento_adecuado_manejo",
        valores: ["totalmente desacuerdo", "desacuerdo", "indiferente", "de acuerdo", "totalmente de acuerdo"],
      },
      "separar-desechos": {
        nombre: "¿Se deben separar los desechos por tipo?",
        campo: "separar_desechos_por_origen",
        valores: ["totalmente desacuerdo", "desacuerdo", "indiferente", "de acuerdo", "totalmente de acuerdo"],
      },
      "clasificacion-correcta": {
        nombre: "¿Es importante la clasificación correcta?",
        campo: "clasificacion_correcta_desechos",
        valores: ["totalmente desacuerdo", "desacuerdo", "indiferente", "de acuerdo", "totalmente de acuerdo"],
      },
      "comportamiento-comunidad": {
        nombre: "¿El comportamiento comunitario influye en el deterioro?",
        campo: "comportamiento_comunidad_influye",
        valores: ["totalmente desacuerdo", "desacuerdo", "indiferente", "de acuerdo", "totalmente de acuerdo"],
      },
      "dedica-tiempo": {
        nombre: "¿Dedica tiempo a reducir, reutilizar o reciclar?",
        campo: "dedica_tiempo_reducir_reutilizar_reciclar",
        valores: ["totalmente desacuerdo", "desacuerdo", "indiferente", "de acuerdo", "totalmente de acuerdo"],
      },
      "problema-comunidad": {
        nombre: "¿Los desechos son un gran problema?",
        campo: "desechos_solidos_problema_comunidad",
        valores: ["totalmente desacuerdo", "desacuerdo", "indiferente", "de acuerdo", "totalmente de acuerdo"],
      },
    },
  },
  "determinantes-efectivos": {
    titulo: "Determinantes Afectivos",
    grupos: {
      "preocupa-exceso": {
        nombre: "¿Le preocupa el exceso de desechos?",
        campo: "preocupa_exceso_desechos",
        valores: ["totalmente desacuerdo", "desacuerdo", "indiferente", "de acuerdo", "totalmente de acuerdo"],
      },
      "desechos-contaminan": {
        nombre: "¿Considera que intervienen en consecuencias climáticas?",
        campo: "desechos_contaminan_ambiente",
        valores: ["totalmente desacuerdo", "desacuerdo", "indiferente", "de acuerdo", "totalmente de acuerdo"],
      },
      "afecta-emocionalmente": {
        nombre: "¿Le afecta emocionalmente las noticias de desastres?",
        campo: "afecta_emocionalmente_noticias_contaminacion",
        valores: ["totalmente desacuerdo", "desacuerdo", "indiferente", "de acuerdo", "totalmente de acuerdo"],
      },
      frustracion: {
        nombre: "¿Siente frustración por falta de acciones?",
        campo: "frustracion_falta_acciones_ambientales",
        valores: ["totalmente desacuerdo", "desacuerdo", "indiferente", "de acuerdo", "totalmente de acuerdo"],
      },
      "planeta-futuro": {
        nombre: "¿Es importante el planeta para futuras generaciones?",
        campo: "importancia_planeta_futuras_generaciones",
        valores: ["totalmente desacuerdo", "desacuerdo", "indiferente", "de acuerdo", "totalmente de acuerdo"],
      },
    },
  },
  "determinantes-cognitivos": {
    titulo: "Determinantes Cognitivos",
    grupos: {
      "consciente-impacto": {
        nombre: "¿Es consciente del impacto en el medio ambiente?",
        campo: "consciente_impacto_desechos_salud",
        valores: ["totalmente desacuerdo", "desacuerdo", "indiferente", "de acuerdo", "totalmente de acuerdo"],
      },
      "investiga-temas": {
        nombre: "¿Investiga frecuentemente temas ambientales?",
        campo: "investiga_temas_ambientales",
        valores: ["totalmente desacuerdo", "desacuerdo", "indiferente", "de acuerdo", "totalmente de acuerdo"],
      },
      "consecuencias-acumulacion": {
        nombre: "¿Conoce las consecuencias de la acumulación?",
        campo: "consecuencias_acumulacion_desechos",
        valores: ["totalmente desacuerdo", "desacuerdo", "indiferente", "de acuerdo", "totalmente de acuerdo"],
      },
      "beneficios-reutilizar": {
        nombre: "¿Conoce los beneficios de reutilizar?",
        campo: "beneficios_reutilizar_residuo",
        valores: ["totalmente desacuerdo", "desacuerdo", "indiferente", "de acuerdo", "totalmente de acuerdo"],
      },
      "falta-informacion": {
        nombre: "¿La falta de información es un obstáculo?",
        campo: "falta_informacion_obstaculo_gestion",
        valores: ["totalmente desacuerdo", "desacuerdo", "indiferente", "de acuerdo", "totalmente de acuerdo"],
      },
    },
  },
  "sustentabilidad-ambiental": {
    titulo: "Sustentabilidad Ambiental",
    grupos: {
      "organicos-funcionalidad": {
        nombre: "¿Los desechos orgánicos tienen otra funcionalidad?",
        campo: "desechos_organicos_funcionalidad",
        valores: ["totalmente desacuerdo", "desacuerdo", "indiferente", "de acuerdo", "totalmente de acuerdo"],
      },
      "acumulacion-salud": {
        nombre: "¿La acumulación afecta la salud?",
        campo: "acumulacion_desechos_afecta_salud",
        valores: ["totalmente desacuerdo", "desacuerdo", "indiferente", "de acuerdo", "totalmente de acuerdo"],
      },
      "reduccion-cuida-ambiente": {
        nombre: "¿La reducción y reciclaje cuida el medio ambiente?",
        campo: "reduccion_reciclaje_reutilizacion_cuida_ambiente",
        valores: ["totalmente desacuerdo", "desacuerdo", "indiferente", "de acuerdo", "totalmente de acuerdo"],
      },
      "transformacion-productos": {
        nombre: "¿La transformación en nuevos productos reduce desechos?",
        campo: "transformacion_desechos_nuevos_productos",
        valores: ["totalmente desacuerdo", "desacuerdo", "indiferente", "de acuerdo", "totalmente de acuerdo"],
      },
      "necesita-educacion": {
        nombre: "¿Necesita más información sobre educación ambiental?",
        campo: "necesita_info_educacion_ambiental",
        valores: ["totalmente desacuerdo", "desacuerdo", "indiferente", "de acuerdo", "totalmente de acuerdo"],
      },
    },
  },
  "sustentabilidad-economica": {
    titulo: "Sustentabilidad Económica",
    grupos: {
      "separacion-reciclaje": {
        nombre: "¿La separación para reciclaje genera ingreso?",
        campo: "practica_separacion_reciclaje_ingreso",
        valores: ["totalmente desacuerdo", "desacuerdo", "indiferente", "de acuerdo", "totalmente de acuerdo"],
      },
      "desechos-reutilizados": {
        nombre: "¿Los desechos pueden ser reutilizados para nuevos productos?",
        campo: "desechos_hogar_reutilizados",
        valores: ["totalmente desacuerdo", "desacuerdo", "indiferente", "de acuerdo", "totalmente de acuerdo"],
      },
      "manejo-desarrollo": {
        nombre: "¿El manejo adecuado aporta al desarrollo económico?",
        campo: "manejo_adecuado_desechos_aporta_desarrollo",
        valores: ["totalmente desacuerdo", "desacuerdo", "indiferente", "de acuerdo", "totalmente de acuerdo"],
      },
      "emprendimientos-economia": {
        nombre: "¿Los emprendimientos aportan a su economía?",
        campo: "emprendimientos_reutilizacion_aportan_economia",
        valores: ["totalmente desacuerdo", "desacuerdo", "indiferente", "de acuerdo", "totalmente de acuerdo"],
      },
      "oportunidad-emprendimiento": {
        nombre: "¿Ofrece oportunidades para emprendimiento?",
        campo: "manejo_adecuado_desechos_oportunidad_emprendimiento",
        valores: ["totalmente desacuerdo", "desacuerdo", "indiferente", "de acuerdo", "totalmente de acuerdo"],
      },
    },
  },
  "desarrollo-comunitario": {
    titulo: "Desarrollo Comunitario",
    grupos: {
      "eventos-concientizacion": {
        nombre: "¿Los eventos de concientización reducen residuos?",
        campo: "reducir_residuos_eventos_concientizacion",
        valores: ["totalmente desacuerdo", "desacuerdo", "indiferente", "de acuerdo", "totalmente de acuerdo"],
      },
      "talleres-practicas": {
        nombre: "¿Participaría en talleres de buenas prácticas?",
        campo: "participaria_talleres_buenas_practicas",
        valores: ["totalmente desacuerdo", "desacuerdo", "indiferente", "de acuerdo", "totalmente de acuerdo"],
      },
      "impacto-ambiente": {
        nombre: "¿El manejo adecuado tiene impacto significativo?",
        campo: "manejo_adecuado_desechos_impacto_ambiente",
        valores: ["totalmente desacuerdo", "desacuerdo", "indiferente", "de acuerdo", "totalmente de acuerdo"],
      },
      "participar-emprendimiento": {
        nombre: "¿Está dispuesto a participar en emprendimientos?",
        campo: "dispuesto_participar_emprendimiento_desechos",
        valores: ["totalmente desacuerdo", "desacuerdo", "indiferente", "de acuerdo", "totalmente de acuerdo"],
      },
      "feria-emprendimientos": {
        nombre: "¿Participaría en feria de emprendimientos?",
        campo: "participaria_feria_emprendimientos_desechos",
        valores: ["totalmente desacuerdo", "desacuerdo", "indiferente", "de acuerdo", "totalmente de acuerdo"],
      },
    },
  },
}

const normalizarValorLikert = (valor: string): string => {
  if (!valor) return ""
  const valorLimpio = valor.toLowerCase().trim()

  // Mapear variaciones a valores estándar
  if (valorLimpio.includes("totalmente") && valorLimpio.includes("acuerdo")) {
    return "totalmente de acuerdo"
  }
  if (valorLimpio === "de acuerdo" || valorLimpio === "acuerdo") {
    return "de acuerdo"
  }
  if (valorLimpio === "indiferente") {
    return "indiferente"
  }
  if (valorLimpio === "desacuerdo" || valorLimpio === "en desacuerdo") {
    return "desacuerdo"
  }
  if (valorLimpio.includes("totalmente") && valorLimpio.includes("desacuerdo")) {
    return "totalmente desacuerdo"
  }

  return valorLimpio
}

const generarTablaLikertPorSeccion = (datos: any[], seccionSeleccionada: string) => {
  const seccion = SECCIONES[seccionSeleccionada as keyof typeof SECCIONES]
  if (!seccion || seccionSeleccionada === "distribucion-demografica") return null

  return Object.entries(seccion.grupos).map(([key, grupo]) => {
    // Opciones Likert estandarizadas
    const opcionesLikert = ["totalmente desacuerdo", "desacuerdo", "indiferente", "de acuerdo", "totalmente de acuerdo"]

    // Inicializar conteos
    const conteos: Record<string, number> = {}
    opcionesLikert.forEach((opcion) => {
      conteos[opcion] = 0
    })

    // Contar respuestas
    datos.forEach((registro) => {
      const valor = registro[grupo.campo]
      if (valor && typeof valor === "string") {
        const valorNorm = normalizarValorLikert(valor)
        if (opcionesLikert.includes(valorNorm)) {
          conteos[valorNorm]++
        }
      }
    })

    const total = Object.values(conteos).reduce((sum, val) => sum + val, 0)

    // Calcular promedio ponderado (1=totalmente desacuerdo, 5=totalmente de acuerdo)
    const suma =
      conteos["totalmente desacuerdo"] * 1 +
      conteos["desacuerdo"] * 2 +
      conteos["indiferente"] * 3 +
      conteos["de acuerdo"] * 4 +
      conteos["totalmente de acuerdo"] * 5
    const promedio = total > 0 ? (suma / total / 5) * 100 : 0

    return {
      nombreGrupo: grupo.nombre,
      pregunta: PREGUNTAS_LIKERT[grupo.campo as keyof typeof PREGUNTAS_LIKERT] || grupo.nombre,
      conteos,
      total,
      promedio,
    }
  })
}

// Mapeo de nombres de campos a preguntas legibles
const PREGUNTAS_LIKERT: Record<string, string> = {
  // Determinantes Socioculturales
  conoce_desechos_solidos: "¿Conoce usted qué son los desechos sólidos domiciliarios?",
  cree_comportamiento_adecuado_manejo:
    "¿Cree usted que existe un comportamiento adecuado en el manejo de los desechos sólidos domiciliarios en la comunidad?",
  separar_desechos_por_origen:
    "¿Se debe separar los desechos sólidos según su tipo ejemplo: (papel - plástico - orgánico - inorgánico)?",
  clasificacion_correcta_desechos:
    "¿Es importante la correcta clasificación de los desechos sólidos orgánicos e inorgánicos en el hogar?",
  comportamiento_comunidad_influye:
    "¿Cree que el comportamiento de la comunidad influye en deterioro del medio ambiente?",
  dedica_tiempo_reducir_reutilizar_reciclar:
    "¿Dedica tiempo para reducir, reutilizar y/o reciclar los desechos sólidos que se generan en el hogar?",
  desechos_solidos_problema_comunidad: "¿Los desechos sólidos son un gran problema para la comunidad?",
  // Determinantes Afectivos
  preocupa_exceso_desechos: "¿Le preocupa el exceso de desechos sólidos domiciliarios?",
  desechos_contaminan_ambiente:
    "¿Considera que los desechos sólidos domiciliarios intervienen en las consecuencias climáticas?",
  afecta_emocionalmente_noticias_contaminacion:
    "¿Le afecta emocionalmente cuando escucha noticias acerca de los desastres naturales?",
  frustracion_falta_acciones_ambientales:
    "¿Siente frustración debido a la falta de acciones significativas para abordar la generación de los desechos sólidos?",
  importancia_planeta_futuras_generaciones:
    "¿Considera importante pensar en el tipo de planeta que dejaremos a las futuras generaciones?",
  // Determinantes Cognitivos
  consciente_impacto_desechos_salud:
    "¿Es consciente del impacto de los desechos sólidos domiciliarios en el medio ambiente?",
  investiga_temas_ambientales: "¿Investiga frecuentemente acerca de temas medio ambientales?",
  consecuencias_acumulacion_desechos:
    "¿Conoce las consecuencias de la acumulación de los desechos sólidos domiciliarios?",
  beneficios_reutilizar_residuo: "¿Conoce los beneficios de reutilizar un residuo domiciliario?",
  falta_informacion_obstaculo_gestion:
    "¿La falta de información es un obstáculo para la correcta gestión de los residuos sólidos domiciliario?",
  // Sustentabilidad Ambiental
  desechos_organicos_funcionalidad: "¿Los desechos orgánicos generados en el hogar pueden tener otra funcionalidad?",
  acumulacion_desechos_afecta_salud: "¿La acumulación de desechos afectan a la salud de la población?",
  reduccion_reciclaje_reutilizacion_cuida_ambiente:
    "¿La reducción, reciclaje y la reutilización de los desechos sólidos puede cuidar al medio ambiente y a la vida silvestre?",
  transformacion_desechos_nuevos_productos:
    "¿Cree que la transformación de desechos sólidos en nuevos productos puede contribuir significativamente a la reducción de la generación de desechos?",
  necesita_info_educacion_ambiental: "¿Necesita más información acerca de educación ambiental?",
  // Sustentabilidad Económica
  practica_separacion_reciclaje_ingreso:
    "¿En su hogar practica la separación de los desechos para el reciclaje y le representa algún ingreso?",
  desechos_hogar_reutilizados:
    "¿Los desechos sólidos generados en el hogar pueden ser reutilizados para una nueva función o creación de un producto?",
  manejo_adecuado_desechos_aporta_desarrollo:
    "¿Cree que el manejo adecuado de los desechos sólidos domiciliarios podría aportar al desarrollo económico comunitario?",
  emprendimientos_reutilizacion_aportan_economia:
    "¿Los emprendimientos en base a la reutilización de los desechos aporta a su economía?",
  manejo_adecuado_desechos_oportunidad_emprendimiento:
    "¿El manejo adecuado de los desechos sólidos domiciliarios ofrece oportunidades para el emprendimiento?",
  // Desarrollo Comunitario
  reducir_residuos_eventos_concientizacion:
    "¿Es posible reducir la generación de residuos sólidos domiciliarios por medio de eventos de concientización?",
  participaria_talleres_buenas_practicas:
    "¿Participaría en talleres de buenas prácticas y capacitaciones para el correcto manejo de los desechos sólidos domiciliarios?",
  manejo_adecuado_desechos_impacto_ambiente:
    "¿El manejo adecuado de los desechos sólidos domiciliarios puede tener un impacto significativo al medio ambiente?",
  dispuesto_participar_emprendimiento_desechos:
    "¿Está dispuesto a participar en un emprendimiento en base al uso de los desechos sólidos?",
  participaria_feria_emprendimientos_desechos:
    "¿Participaría a una feria de emprendimientos comunitarios en base a desechos domiciliarios reutilizados?",
}

export function ComportamientoGraficos({ datos }: GraficosProps) {
  const [tipoGrafico, setTipoGrafico] = useState<"barras" | "torta" | "lineal">("barras")
  const [seccionSeleccionada, setSeccionSeleccionada] = useState<string>("distribucion-demografica")
  const [grupoSeleccionado, setGrupoSeleccionado] = useState<string>("estado-civil")

  const procesarDatos = () => {
    const seccion = SECCIONES[seccionSeleccionada as keyof typeof SECCIONES]
    const grupo = seccion.grupos[grupoSeleccionado as keyof typeof seccion.grupos]

    if (!grupo) return []

    const conteos: Record<string, number> = {}
    grupo.valores.forEach((valor) => {
      conteos[valor] = 0
    })

    datos.forEach((registro) => {
      const valor = registro[grupo.campo]
      if (valor) {
        const valorStr = valor.toString()
        // Para secciones Likert
        if (seccionSeleccionada !== "distribucion-demografica") {
          const valorNorm = normalizarValorLikert(valorStr)
          const valorEncontrado = grupo.valores.find((v) => v === valorNorm)
          if (valorEncontrado) {
            conteos[valorEncontrado] = (conteos[valorEncontrado] || 0) + 1
          }
        } else {
          // Para secciones demográficas
          const valorNorm = valorStr.toLowerCase().trim()
          const valorEncontrado = grupo.valores.find((v) => v.toLowerCase() === valorNorm)
          if (valorEncontrado) {
            conteos[valorEncontrado] = (conteos[valorEncontrado] || 0) + 1
          }
        }
      }
    })

    const total = Object.values(conteos).reduce((sum, val) => sum + val, 0)

    return Object.entries(conteos).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      porcentaje: total > 0 ? (value / total) * 100 : 0,
    }))
  }

  const generarTablaPorSeccion = () => {
    const seccion = SECCIONES[seccionSeleccionada as keyof typeof SECCIONES]
    if (!seccion) return null

    return Object.entries(seccion.grupos).map(([key, grupo]) => {
      const conteos: Record<string, number> = {}
      grupo.valores.forEach((valor) => {
        conteos[valor] = 0
      })

      datos.forEach((registro) => {
        const valor = registro[grupo.campo]
        if (valor) {
          const valorStr = valor.toString()
          if (seccionSeleccionada !== "distribucion-demografica") {
            const valorNorm = normalizarValorLikert(valorStr)
            const valorEncontrado = grupo.valores.find((v) => v === valorNorm)
            if (valorEncontrado) {
              conteos[valorEncontrado] = (conteos[valorEncontrado] || 0) + 1
            }
          } else {
            const valorNorm = valorStr.toLowerCase().trim()
            const valorEncontrado = grupo.valores.find((v) => v.toLowerCase() === valorNorm)
            if (valorEncontrado) {
              conteos[valorEncontrado] = (conteos[valorEncontrado] || 0) + 1
            }
          }
        }
      })

      const total = Object.values(conteos).reduce((sum, val) => sum + val, 0)

      return {
        nombreGrupo: grupo.nombre,
        datos: Object.entries(conteos).map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value,
          porcentaje: total > 0 ? (value / total) * 100 : 0,
        })),
        total,
      }
    })
  }

  const datosGrafico = procesarDatos()
  const seccionActual = SECCIONES[seccionSeleccionada as keyof typeof SECCIONES]
  const grupoActual = seccionActual?.grupos[grupoSeleccionado as keyof typeof seccionActual.grupos]
  const tablasSeccion = generarTablaPorSeccion()
  const tablasLikert = generarTablaLikertPorSeccion(datos, seccionSeleccionada)

  return (
    <div className="space-y-8">
      <Card className="p-6 border border-border">
        <div className="mb-8 space-y-6">
          <h3 className="text-2xl font-bold text-foreground">Análisis de Comportamiento Proambiental</h3>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Seleccionar Sección</label>
            <Select
              value={seccionSeleccionada}
              onValueChange={(value) => {
                setSeccionSeleccionada(value)
                const primeraSeccion = SECCIONES[value as keyof typeof SECCIONES]
                const primerGrupo = Object.keys(primeraSeccion.grupos)[0]
                setGrupoSeleccionado(primerGrupo)
              }}
            >
              <SelectTrigger className="bg-white border-border max-w-md">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {Object.entries(SECCIONES).map(([key, seccion]) => (
                  <SelectItem key={key} value={key}>
                    {seccion.titulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Seleccionar Variable</label>
            <Select value={grupoSeleccionado} onValueChange={setGrupoSeleccionado}>
              <SelectTrigger className="bg-white border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {seccionActual &&
                  Object.entries(seccionActual.grupos).map(([key, grupo]) => (
                    <SelectItem key={key} value={key}>
                      {grupo.nombre}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 flex-wrap">
            <Button
              onClick={() => setTipoGrafico("barras")}
              variant={tipoGrafico === "barras" ? "default" : "outline"}
              size="sm"
              className={tipoGrafico === "barras" ? "bg-primary text-white hover:bg-primary" : ""}
            >
              Gráfico de Barras
            </Button>
            <Button
              onClick={() => setTipoGrafico("torta")}
              variant={tipoGrafico === "torta" ? "default" : "outline"}
              size="sm"
              className={tipoGrafico === "torta" ? "bg-primary text-white hover:bg-primary" : ""}
            >
              Gráfico Circular
            </Button>
            <Button
              onClick={() => setTipoGrafico("lineal")}
              variant={tipoGrafico === "lineal" ? "default" : "outline"}
              size="sm"
              className={tipoGrafico === "lineal" ? "bg-primary text-white hover:bg-primary" : ""}
            >
              Gráfico de Línea
            </Button>
          </div>
        </div>

        <div className="w-full">
          {tipoGrafico === "barras" && (
            <div style={{ width: "100%", height: "500px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosGrafico} margin={{ top: 40, right: 30, left: 60, bottom: 100 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={120}
                    fontSize={12}
                    tick={{ fill: "#4b5563" }}
                  />
                  <YAxis fontSize={12} tick={{ fill: "#4b5563" }} />
                  <Tooltip
                    formatter={(value) => `${value} respuestas`}
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "6px",
                    }}
                  />
                  <Bar
                    dataKey="value"
                    label={(props: any) => {
                      const { x, y, width, index } = props
                      const porcentaje = datosGrafico[index]?.porcentaje ?? 0
                      return (
                        <text
                          x={x + width / 2}
                          y={y - 8}
                          fill="#1f2937"
                          textAnchor="middle"
                          fontSize={12}
                          fontWeight="bold"
                        >
                          {`${porcentaje.toFixed(1)}%`}
                        </text>
                      )
                    }}
                    radius={[6, 6, 0, 0]}
                  >
                    {datosGrafico.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {tipoGrafico === "torta" && (
            <div style={{ width: "100%", height: "600px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={datosGrafico}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry: any) => {
                      const porcentaje = entry.porcentaje ?? 0
                      if (porcentaje < 2) return ""
                      return `${porcentaje.toFixed(1)}%`
                    }}
                    outerRadius={160}
                    innerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {datosGrafico.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => `${value} respuestas`}
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "6px",
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    wrapperStyle={{ paddingTop: "20px", fontSize: "12px" }}
                    formatter={(value, entry: any) => {
                      const porcentaje = entry.payload?.porcentaje ?? 0
                      return `${value} (${porcentaje.toFixed(1)}%)`
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {tipoGrafico === "lineal" && (
            <div style={{ width: "100%", height: "500px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={datosGrafico} margin={{ top: 40, right: 30, left: 60, bottom: 100 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={120}
                    fontSize={12}
                    tick={{ fill: "#4b5563" }}
                  />
                  <YAxis fontSize={12} tick={{ fill: "#4b5563" }} />
                  <Tooltip
                    formatter={(value) => `${value} respuestas`}
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "6px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#0ea5e9"
                    dot={(props: any) => {
                      const { cx, cy, payload, index } = props
                      const pointColor = COLORS[index % COLORS.length]
                      return (
                        <g key={`dot-${payload.name}`}>
                          <circle cx={cx} cy={cy} r={6} fill={pointColor} stroke="white" strokeWidth={2} />
                          <text x={cx} y={cy - 28} textAnchor="middle" fontSize={11} fontWeight="600" fill="#1f2937">
                            {`${payload.porcentaje.toFixed(1)}%`}
                          </text>
                        </g>
                      )
                    }}
                    strokeWidth={3}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6 border border-border">
        <h3 className="text-2xl font-bold text-foreground mb-6">{seccionActual?.titulo} - Datos Detallados</h3>
        <div className="space-y-8">
          {seccionSeleccionada === "distribucion-demografica" && tablasSeccion && tablasSeccion.length > 0 && (
            <div className="space-y-8">
              <h3 className="text-2xl font-bold text-foreground">Datos Demográficos</h3>
              {tablasSeccion?.map((tabla, idx) => (
                <div key={idx}>
                  <h4 className="text-lg font-semibold text-foreground mb-4">{tabla.nombreGrupo}</h4>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="font-bold">Categoría</TableHead>
                          <TableHead className="font-bold text-right">Cantidad</TableHead>
                          <TableHead className="font-bold text-right">% del Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tabla.datos.map((fila, idx2) => (
                          <TableRow key={idx2}>
                            <TableCell className="font-medium capitalize">{fila.name}</TableCell>
                            <TableCell className="text-right">{fila.value}</TableCell>
                            <TableCell className="text-right">{fila.porcentaje.toFixed(2)}%</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted/50 font-bold">
                          <TableCell>Total</TableCell>
                          <TableCell className="text-right">{tabla.total}</TableCell>
                          <TableCell className="text-right">100%</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))}
            </div>
          )}

          {seccionSeleccionada !== "distribucion-demografica" && tablasLikert && tablasLikert.length > 0 && (
            <div className="space-y-8">
              <h3 className="text-2xl font-bold text-foreground">{seccionActual?.titulo || "Datos de la Sección"}</h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-bold min-w-[400px]">Pregunta</TableHead>
                      <TableHead className="font-bold text-center">Totalmente Desacuerdo</TableHead>
                      <TableHead className="font-bold text-center">Desacuerdo</TableHead>
                      <TableHead className="font-bold text-center">Indiferente</TableHead>
                      <TableHead className="font-bold text-center">De Acuerdo</TableHead>
                      <TableHead className="font-bold text-center">Totalmente Acuerdo</TableHead>
                      <TableHead className="font-bold text-center bg-muted">Promedio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tablasLikert.map((tabla, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{tabla.pregunta}</TableCell>
                        <TableCell className="text-center">
                          {tabla.total > 0
                            ? ((tabla.conteos["totalmente desacuerdo"] / tabla.total) * 100).toFixed(1) + "%"
                            : "0.0%"}
                        </TableCell>
                        <TableCell className="text-center">
                          {tabla.total > 0
                            ? ((tabla.conteos["desacuerdo"] / tabla.total) * 100).toFixed(1) + "%"
                            : "0.0%"}
                        </TableCell>
                        <TableCell className="text-center">
                          {tabla.total > 0
                            ? ((tabla.conteos["indiferente"] / tabla.total) * 100).toFixed(1) + "%"
                            : "0.0%"}
                        </TableCell>
                        <TableCell className="text-center">
                          {tabla.total > 0
                            ? ((tabla.conteos["de acuerdo"] / tabla.total) * 100).toFixed(1) + "%"
                            : "0.0%"}
                        </TableCell>
                        <TableCell className="text-center">
                          {tabla.total > 0
                            ? ((tabla.conteos["totalmente de acuerdo"] / tabla.total) * 100).toFixed(1) + "%"
                            : "0.0%"}
                        </TableCell>
                        <TableCell className="text-center bg-muted font-bold">{tabla.promedio.toFixed(1)}%</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/70">
                      <TableCell className="font-bold">Promedio General</TableCell>
                      <TableCell className="text-center font-bold">
                        {tablasLikert.length > 0
                          ? (
                              (tablasLikert.reduce((sum, t) => sum + t.conteos["totalmente desacuerdo"], 0) /
                                tablasLikert.reduce((sum, t) => sum + t.total, 0)) *
                              100
                            ).toFixed(1) + "%"
                          : "0.0%"}
                      </TableCell>
                      <TableCell className="text-center font-bold">
                        {tablasLikert.length > 0
                          ? (
                              (tablasLikert.reduce((sum, t) => sum + t.conteos["desacuerdo"], 0) /
                                tablasLikert.reduce((sum, t) => sum + t.total, 0)) *
                              100
                            ).toFixed(1) + "%"
                          : "0.0%"}
                      </TableCell>
                      <TableCell className="text-center font-bold">
                        {tablasLikert.length > 0
                          ? (
                              (tablasLikert.reduce((sum, t) => sum + t.conteos["indiferente"], 0) /
                                tablasLikert.reduce((sum, t) => sum + t.total, 0)) *
                              100
                            ).toFixed(1) + "%"
                          : "0.0%"}
                      </TableCell>
                      <TableCell className="text-center font-bold">
                        {tablasLikert.length > 0
                          ? (
                              (tablasLikert.reduce((sum, t) => sum + t.conteos["de acuerdo"], 0) /
                                tablasLikert.reduce((sum, t) => sum + t.total, 0)) *
                              100
                            ).toFixed(1) + "%"
                          : "0.0%"}
                      </TableCell>
                      <TableCell className="text-center font-bold">
                        {tablasLikert.length > 0
                          ? (
                              (tablasLikert.reduce((sum, t) => sum + t.conteos["totalmente de acuerdo"], 0) /
                                tablasLikert.reduce((sum, t) => sum + t.total, 0)) *
                              100
                            ).toFixed(1) + "%"
                          : "0.0%"}
                      </TableCell>
                      <TableCell className="text-center bg-muted font-bold text-lg">
                        {tablasLikert.length > 0
                          ? (tablasLikert.reduce((sum, t) => sum + t.promedio, 0) / tablasLikert.length).toFixed(1) +
                            "%"
                          : "0.0%"}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
