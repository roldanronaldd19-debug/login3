export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-secondary-bg mt-20">
      <div className="container-safe py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Información del proyecto */}
          <div>
            <span className="text-sm font-bold text-primary uppercase tracking-widest mb-2 inline-block">
              Plataforma
            </span>
            <h3 className="text-lg font-bold text-primary-text mb-3">Residuos Sólidos</h3>
            <p className="text-sm text-secondary-text leading-relaxed">
              Sistema integral de monitoreo, análisis y reporte de residuos sólidos del Cantón Daule. Información
              transparente para ciudadanos y autoridades.
            </p>
          </div>

          {/* Enlaces */}
          <div>
            <p className="text-sm font-bold text-primary-text mb-5 uppercase tracking-widest">Enlaces útiles</p>
            <ul className="space-y-3 text-sm text-secondary-text">
              <li>
                <a href="#" className="hover:text-primary font-medium transition-colors">
                  Política de privacidad
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary font-medium transition-colors">
                  Términos de uso
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary font-medium transition-colors">
                  Contacto
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary font-medium transition-colors">
                  Reportar problema
                </a>
              </li>
            </ul>
          </div>

          {/* Información de contacto */}
          <div>
            <p className="text-sm font-bold text-primary-text mb-5 uppercase tracking-widest">Contacto</p>
            <div className="text-sm text-secondary-text space-y-2">
              <p>
                <strong className="text-primary-text">GAD Cantón Daule</strong>
              </p>
              <p>Email: info@daule.gob.ec</p>
              <p>Teléfono: +593-4-2000-000</p>
            </div>
          </div>
        </div>

        {/* Divisor */}
        <div className="border-t border-border pt-8">
          <p className="text-center text-sm text-tertiary-text">
            &copy; {currentYear} Gestión de Residuos Sólidos - Cantón Daule. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
