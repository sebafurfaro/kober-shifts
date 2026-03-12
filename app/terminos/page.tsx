"use client";

import * as React from "react";
import { Header } from "../components/header";
import Typography from "../components/Typography";
import Link from "next/link";
import { Section } from "../plataforma/[tenantId]/panel/components/layout/Section";
import { Footer } from "../components/Footer";


export default function TermsAndConditionsPage() {
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
    const navItems = [
    {
      label: "Precios",
      href: "#precios"
    },
    {
      label: "Beneficios",
      href: "#beneficios"
    }
  ]
    return (
        <div className="min-h-screen bg-white font-primary w-full">
              <Header mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} navItems={navItems} />
              <section className="bg-linear-to-b from-blue-200 via-blue-50 to-white py-16">
                        <div className="max-w-6xl mx-auto w-full px-4 md:px-2 mt-10 space-y-6 items-center">
                          <Typography variant="h2" className="text-primary">Terminos y condiciones</Typography>            
                        </div>
                      </section>
        <Section className="mt-12">
            <div className="mb-6">
        <Typography variant="h3" className="mb-2 font-bold uppercase">
          TÉRMINOS Y CONDICIONES DEL SERVICIO
        </Typography>
        <Typography variant="p" className="mb-4">
          <strong>Última actualización:</strong> 26-02-2026
        </Typography>
      </div>

      <div className="mb-8">
        <Typography variant="p" className="mb-4">
          El presente documento regula el uso del sistema de gestión de turnos online (en adelante, el “Sistema”), operado por:
        </Typography>
        <Typography variant="p" className="mb-4">
          <strong>Titular:</strong> NodoApp<br />
          <strong>Correo electrónico:</strong> <Link href="mailto:turnos.nodoapp@gmail.com" className="ml-1">turnos.nodoapp@gmail.com</Link><br />
          <strong>WhatsApp de contacto:</strong> <Link href="https://wa.me/541173740338" className="ml-1">11 7374 0338</Link>
        </Typography>
        <Typography variant="p">
          Al utilizar el Sistema, el usuario acepta los presentes Términos y Condiciones.
        </Typography>
      </div>

      <div className="mb-8">
        <Typography variant="h3" className="mb-4 font-bold">
          1. Descripción del servicio
        </Typography>
        <Typography variant="p" className="mb-4">
          El Sistema es una plataforma tecnológica que permite:
        </Typography>
        <ul className="list-disc pl-6 mb-4">
          <li><Typography variant="p">Solicitar turnos online.</Typography></li>
          <li><Typography variant="p">Gestionar confirmaciones, cancelaciones y reprogramaciones.</Typography></li>
          <li><Typography variant="p">Enviar notificaciones automáticas relacionadas con los turnos.</Typography></li>
        </ul>
        <Typography variant="p" className="mb-4">
          El Sistema actúa como intermediario tecnológico entre el profesional/comercio y el cliente final.
        </Typography>
        <Typography variant="p">
          No presta directamente los servicios profesionales ofrecidos por terceros.
        </Typography>
      </div>

      <div className="mb-8">
        <Typography variant="h3" className="mb-4 font-bold">
          2. Aceptación de los términos
        </Typography>
        <Typography variant="p" className="mb-4">
          El acceso y uso del Sistema implica la aceptación plena y sin reservas de los presentes Términos y Condiciones.
        </Typography>
        <Typography variant="p">
          Si el usuario no está de acuerdo con alguna de las disposiciones aquí establecidas, deberá abstenerse de utilizar el Sistema.
        </Typography>
      </div>

      <div className="mb-8">
        <Typography variant="h3" className="mb-4 font-bold">
          3. Uso del sistema
        </Typography>
        <Typography variant="p" className="mb-4">
          El usuario se compromete a:
        </Typography>
        <ul className="list-disc pl-6 mb-4">
          <li><Typography variant="p">Proporcionar información veraz y actualizada.</Typography></li>
          <li><Typography variant="p">No utilizar el Sistema para fines ilícitos.</Typography></li>
          <li><Typography variant="p">No interferir en el funcionamiento técnico de la plataforma.</Typography></li>
          <li><Typography variant="p">No intentar acceder a información o cuentas de terceros.</Typography></li>
        </ul>
        <Typography variant="p">
          El titular podrá suspender el acceso en caso de uso indebido.
        </Typography>
      </div>

      <div className="mb-8">
        <Typography variant="h3" className="mb-4 font-bold">
          4. Responsabilidad sobre los servicios prestados
        </Typography>
        <Typography variant="p" className="mb-4">
          El Sistema es únicamente una herramienta de gestión.
        </Typography>
        <Typography variant="p" className="mb-4">
          La prestación efectiva del servicio solicitado (ej. consulta, tratamiento, asesoramiento, etc.) es responsabilidad exclusiva del profesional o comercio correspondiente.
        </Typography>
        <Typography variant="p">
          El titular del Sistema no garantiza resultados ni calidad del servicio brindado por terceros.
        </Typography>
      </div>

      <div className="mb-8">
        <Typography variant="h3" className="mb-4 font-bold">
          5. Confirmaciones y recordatorios
        </Typography>
        <Typography variant="p" className="mb-4">
          El Sistema podrá enviar confirmaciones y recordatorios automáticos mediante correo electrónico o mensajería instantánea, incluyendo la integración con <strong>Meta Platforms</strong> a través de <strong>WhatsApp Business Platform</strong>.
        </Typography>
        <Typography variant="p" className="mb-4">
          El usuario acepta recibir comunicaciones estrictamente vinculadas con la gestión del turno solicitado.
        </Typography>
        <Typography variant="p">
          La falta de recepción de un recordatorio no invalida el turno programado.
        </Typography>
      </div>

      <div className="mb-8">
        <Typography variant="h3" className="mb-4 font-bold">
          6. Cancelaciones y reprogramaciones
        </Typography>
        <Typography variant="p" className="mb-4">
          Las condiciones específicas de cancelación o reprogramación pueden depender del profesional o comercio que ofrece el servicio.
        </Typography>
        <Typography variant="p" className="mb-4">
          El Sistema no es responsable por:
        </Typography>
        <ul className="list-disc pl-6 mb-4">
          <li><Typography variant="p">Penalidades aplicadas por el profesional.</Typography></li>
          <li><Typography variant="p">Pérdida de señas o anticipos.</Typography></li>
          <li><Typography variant="p">Políticas internas de cada prestador.</Typography></li>
        </ul>
      </div>

      <div className="mb-8">
        <Typography variant="h3" className="mb-4 font-bold">
          7. Limitación de responsabilidad
        </Typography>
        <Typography variant="p" className="mb-4">
          El titular no será responsable por:
        </Typography>
        <ul className="list-disc pl-6 mb-4">
          <li><Typography variant="p">Interrupciones del servicio por causas técnicas.</Typography></li>
          <li><Typography variant="p">Fallas de conectividad o servicios de terceros.</Typography></li>
          <li><Typography variant="p">Errores derivados de información incorrecta proporcionada por el usuario.</Typography></li>
          <li><Typography variant="p">Daños indirectos o lucro cesante.</Typography></li>
        </ul>
        <Typography variant="p">
          El servicio se ofrece “tal cual” y según disponibilidad.
        </Typography>
      </div>

      <div className="mb-8">
        <Typography variant="h3" className="mb-4 font-bold">
          8. Propiedad intelectual
        </Typography>
        <Typography variant="p" className="mb-4">
          Todos los derechos sobre el Software, diseño, código, marca y contenidos propios pertenecen al titular del Sistema.
        </Typography>
        <Typography variant="p">
          Queda prohibida su reproducción o uso sin autorización expresa.
        </Typography>
      </div>

      <div className="mb-8">
        <Typography variant="h3" className="mb-4 font-bold">
          9. Protección de datos personales
        </Typography>
        <Typography variant="p">
          El tratamiento de datos personales se rige por la Política de Privacidad del Sistema, redactada conforme a la Ley 25.326 de Protección de Datos Personales de la República Argentina.
        </Typography>
      </div>

      <div className="mb-8">
        <Typography variant="h3" className="mb-4 font-bold">
          10. Modificaciones del servicio
        </Typography>
        <Typography variant="p" className="mb-4">
          El titular se reserva el derecho de modificar funcionalidades, actualizar condiciones o suspender temporal o definitivamente el servicio.
        </Typography>
        <Typography variant="p">
          Las modificaciones serán publicadas en esta misma URL.
        </Typography>
      </div>

      <div>
        <Typography variant="h3" className="mb-4 font-bold">
          11. Jurisdicción y ley aplicable
        </Typography>
        <Typography variant="p" className="mb-4">
          Los presentes Términos se rigen por las leyes de la República Argentina.
        </Typography>
        <Typography variant="p">
          Ante cualquier controversia, las partes se someten a la jurisdicción de los tribunales ordinarios con competencia en Ciudad Autónoma de Buenos Aires, renunciando a cualquier otro fuero que pudiera corresponder.
        </Typography>
      </div>
        </Section>
        <Footer />
      </div>
    )
}