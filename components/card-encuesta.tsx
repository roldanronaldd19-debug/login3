import Link from "next/link"

type ColorType = "primary" | "accent"

interface CardEncuestaProps {
  titulo: string
  objetivo: string
  enlace: string
  numero: number
  color: ColorType
}

/* Agregado parámetro color para diferenciar tarjetas de encuestas */
const colorBgMap: Record<ColorType, string> = {
  accent: "bg-accent-lighter border-accent/20 hover:border-accent/40",
  primary: "bg-primary-lighter border-primary/20 hover:border-primary/40",
}

const colorBadgeMap: Record<ColorType, string> = {
  accent: "bg-accent text-white",
  primary: "bg-primary text-white",
}

export function CardEncuesta({ titulo, objetivo, enlace, numero, color }: CardEncuestaProps) {
  return (
    <Link href={enlace} target="_blank" rel="noopener noreferrer">
      <div className="group cursor-pointer h-full">
        <div
          className={`flex flex-col h-full rounded-xl border-2 ${colorBgMap[color]} p-8 transition-all duration-300 hover:shadow-xl hover:scale-105`}
        >
          {/* Número de encuesta con badge profesional */}
          <div className="inline-flex items-center gap-2 mb-5 w-fit">
            <span className={`px-3 py-1 text-xs font-bold rounded-full ${colorBadgeMap[color]}`}>
              Encuesta {numero}
            </span>
          </div>

          {/* Título */}
          <h3 className="text-lg font-bold text-foreground mb-4 leading-snug group-hover:text-accent transition-colors">
            {titulo}
          </h3>

          {/* Objetivo con etiqueta clara */}
          <div className="mb-6 flex-grow">
            <p className="text-xs font-bold text-foreground/50 uppercase tracking-widest mb-2">Objetivo</p>
            <p className="text-sm text-foreground/60 leading-relaxed">{objetivo}</p>
          </div>

          {/* CTA mejorado */}
          <div
            className="flex items-center gap-2 font-semibold group-hover:gap-3 transition-all"
            style={{ color: `var(--${color})` }}
          >
            <span className="text-sm">Responder encuesta</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
