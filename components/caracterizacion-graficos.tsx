"use client"

import { useState, useRef } from "react"
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
import { Download, Image, FileText } from "lucide-react"

interface GraficosProps {
  datos: { name: string; value: number; porcentaje: number }[]
}

/* Paleta de colores expandida: 15 colores diferenciados para cada categoría */
const COLORS = [
  "#10b981", // Verde bosque
  "#059669", // Verde oscuro
  "#14b8a6", // Teal
  "#0d9488", // Teal oscuro
  "#06b6d4", // Cyan
  "#0891b2", // Cyan oscuro
  "#0ea5e9", // Azul claro
  "#0284c7", // Azul
  "#3b82f6", // Azul royal
  "#2563eb", // Azul intenso
  "#6366f1", // Índigo
  "#4f46e5", // Índigo oscuro
  "#8b5cf6", // Púrpura
  "#7c3aed", // Púrpura oscuro
  "#a855f7", // Púrpura claro
]

/* Función para calcular el ancho de etiqueta del eje Y dinámicamente */
const calculateYAxisWidth = (datos: any[]) => {
  const maxValue = Math.max(...datos.map((d) => d.value))
  const maxDigits = maxValue.toFixed(0).length
  return Math.max(50, maxDigits * 8 + 20)
}

// Declaración global para html2canvas
declare global {
  interface Window {
    html2canvas: any;
  }
}

export function CaracterizacionGraficos({ datos }: GraficosProps) {
  const [tipoGrafico, setTipoGrafico] = useState<"barras" | "torta" | "lineal">("barras")
  const [isDownloading, setIsDownloading] = useState(false)
  const chartContainerRef = useRef<HTMLDivElement>(null)

  const yAxisWidth = calculateYAxisWidth(datos)
  const barChartMargin = { top: 30, right: 30, left: yAxisWidth, bottom: 100 }
  const lineChartMargin = { top: 30, right: 30, left: yAxisWidth + 80, bottom: 100 }

  // Función para descargar el gráfico como imagen PNG
  const handleDownloadImage = async () => {
    if (!chartContainerRef.current || isDownloading) return
    
    setIsDownloading(true)
    try {
      // Importar html2canvas dinámicamente para evitar problemas de SSR
      const html2canvas = (await import('html2canvas')).default
      
      // Encontrar el contenedor específico del gráfico actual
      const chartElement = chartContainerRef.current.querySelector('.chart-content')
      
      if (chartElement) {
        const canvas = await html2canvas(chartElement as HTMLElement, {
          backgroundColor: "#ffffff",
          scale: 2,
          useCORS: true,
          logging: false,
        })
        
        const image = canvas.toDataURL("image/png", 1.0)
        const link = document.createElement("a")
        link.href = image
        link.download = `grafico_${tipoGrafico}_${new Date().toISOString().slice(0, 10)}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (error) {
      console.error("Error al descargar el gráfico:", error)
      alert("Error al descargar la imagen. Intenta de nuevo.")
    } finally {
      setIsDownloading(false)
    }
  }

  // Función para descargar los datos como CSV
  const handleDownloadCSV = () => {
    try {
      // Crear contenido CSV
      const headers = ["Categoría", "Peso (kg)", "Porcentaje (%)"]
      const rows = datos.map(d => [
        `"${d.name}"`,
        d.value.toFixed(2),
        d.porcentaje.toFixed(2)
      ])
      
      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.join(","))
      ].join("\n")
      
      // Crear y descargar archivo
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `datos_desechos_${new Date().toISOString().slice(0, 10)}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Error al descargar CSV:", error)
    }
  }

  // Función para copiar los datos al portapapeles
  const handleCopyToClipboard = async () => {
    try {
      const text = datos.map(d => 
        `${d.name}: ${d.value.toFixed(2)} kg (${d.porcentaje.toFixed(2)}%)`
      ).join("\n")
      
      await navigator.clipboard.writeText(text)
      alert("Datos copiados al portapapeles")
    } catch (error) {
      console.error("Error al copiar:", error)
    }
  }

  return (
    <Card className="p-6 border border-border" ref={chartContainerRef}>
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-2xl font-bold text-foreground">Distribución de Desechos por Categoría</h3>
        <div className="flex gap-2">
          <Button
            onClick={handleCopyToClipboard}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            Copiar datos
          </Button>
          <Button
            onClick={handleDownloadCSV}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            CSV
          </Button>
          <Button
            onClick={handleDownloadImage}
            disabled={isDownloading}
            variant="default"
            size="sm"
            className="flex items-center gap-2 bg-primary"
          >
            <Image className="h-4 w-4" />
            {isDownloading ? "Descargando..." : "Descargar Gráfico"}
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex gap-3 flex-wrap">
          <Button
            onClick={() => setTipoGrafico("barras")}
            variant={tipoGrafico === "barras" ? "default" : "outline"}
            size="sm"
            className={tipoGrafico === "barras" ? "bg-primary text-white hover:bg-primary-light" : ""}
          >
            Gráfico de Barras
          </Button>
          <Button
            onClick={() => setTipoGrafico("torta")}
            variant={tipoGrafico === "torta" ? "default" : "outline"}
            size="sm"
            className={tipoGrafico === "torta" ? "bg-accent text-white hover:bg-accent-light" : ""}
          >
            Gráfico Circular
          </Button>
          <Button
            onClick={() => setTipoGrafico("lineal")}
            variant={tipoGrafico === "lineal" ? "default" : "outline"}
            size="sm"
            className={tipoGrafico === "lineal" ? "bg-accent text-white hover:bg-accent-light" : ""}
          >
            Gráfico de Línea
          </Button>
        </div>
      </div>

      {/* Contenedor del gráfico para captura */}
      <div className="chart-content">
        {tipoGrafico === "barras" && (
          <div style={{ width: "100%", height: "500px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={datos} margin={barChartMargin}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={120}
                  fontSize={12}
                  tick={{ fill: "#4b5563" }}
                />
                <YAxis fontSize={12} tick={{ fill: "#4b5563" }} width={yAxisWidth} />
                <Tooltip
                  formatter={(value) => `${(value as number).toFixed(2)} kg`}
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                  }}
                  labelStyle={{ color: "#1f2937" }}
                />
                <Bar
                  dataKey="value"
                  label={(props: any) => {
                    const { x, y, width, index } = props
                    const porcentaje = datos[index]?.porcentaje ?? 0
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
                  {datos.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tipoGrafico === "torta" && (
          <div
            style={{ width: "100%", height: "600px", display: "flex", justifyContent: "center", alignItems: "center" }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <Pie
                  data={datos}
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
                  {datos.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => `${(value as number).toFixed(2)} kg`}
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                  }}
                  labelStyle={{ color: "#1f2937" }}
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
              <LineChart data={datos} margin={lineChartMargin}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={120}
                  fontSize={12}
                  tick={{ fill: "#4b5563" }}
                />
                <YAxis fontSize={12} tick={{ fill: "#4b5563" }} width={yAxisWidth} />
                <Tooltip
                  formatter={(value) => `${(value as number).toFixed(2)} kg`}
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                  }}
                  labelStyle={{ color: "#1f2937" }}
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

      {/* Tabla de datos para referencia */}
      <div className="mt-8">
        <h4 className="text-lg font-semibold mb-4">Datos en tabla</h4>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-4 py-2 text-left">Categoría</th>
                <th className="border border-gray-200 px-4 py-2 text-left">Peso (kg)</th>
                <th className="border border-gray-200 px-4 py-2 text-left">Porcentaje (%)</th>
              </tr>
            </thead>
            <tbody>
              {datos.map((item, index) => (
                <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="border border-gray-200 px-4 py-2">{item.name}</td>
                  <td className="border border-gray-200 px-4 py-2">{item.value.toFixed(2)}</td>
                  <td className="border border-gray-200 px-4 py-2">{item.porcentaje.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  )
}
