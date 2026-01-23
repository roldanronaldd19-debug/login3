import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function ReportesPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow">
        <section className="gradient-eco text-white py-20 md:py-28 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/5"></div>
          <div className="container-safe relative z-10">
            <span className="inline-block px-3 py-1 rounded-full bg-white/15 text-white text-xs font-medium mb-4">
              DOCUMENTACIÓN TÉCNICA
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-5xl font-bold mb-6 text-balance leading-tight">Reportes</h1>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl text-balance leading-relaxed">
              Reportes técnicos, documentos especializados y análisis detallados sobre la gestión de residuos sólidos en
              el Cantón Daule.
            </p>
          </div>
        </section>

        {/* Contenido placeholder con estructura profesional */}
        <section className="py-20 md:py-28 bg-background">
          <div className="container-safe">
            <span className="inline-block px-3 py-1 rounded-full bg-accent4-lighter text-accent4 font-medium text-xs mb-6">
              INFORMACIÓN
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-primary-text mb-8">Documentos disponibles</h2>
            <div className="card-elevated p-8 md:p-12">
              <p className="text-secondary-text text-lg leading-relaxed">
                En esta sección encontrarás reportes técnicos, estudios especializados y documentación completa sobre la
                gestión de residuos sólidos. Los reportes se publican regularmente.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
