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

export function CaracterizacionGraficos({ datos }: GraficosProps) {
  const [tipoGrafico, setTipoGrafico] = useState<"barras" | "torta" | "lineal">("barras")

  const yAxisWidth = calculateYAxisWidth(datos)
  const barChartMargin = { top: 30, right: 30, left: yAxisWidth, bottom: 100 }
  const lineChartMargin = { top: 30, right: 30, left: yAxisWidth + 80, bottom: 100 }

  return (
    <Card className="p-6 border border-border">
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-foreground mb-6">Distribución de Desechos por Categoría</h3>
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

      <div className="w-full">
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
    </Card>
  )
}
