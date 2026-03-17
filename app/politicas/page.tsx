"use client";

import * as React from "react";
import { Header } from "../components/header";
import Typography from "../components/Typography";
import Link from "next/link";
import { Section } from "../plataforma/[tenantId]/panel/components/layout/Section";
import { Footer } from "../components/Footer";


export default function PolicyPage() {
    return (
      <div className="min-h-screen bg-white font-primary w-full">
        <Header />
        <section className="bg-linear-to-b from-blue-200 via-blue-50 to-white py-16">
          <div className="max-w-6xl mx-auto w-full px-4 md:px-2 mt-10 space-y-6 items-center">
            <Typography variant="h2" className="text-primary">Politicas de privacidad</Typography>            
          </div>
        </section>
        <Section className="mt-16">
            
      
      <Typography variant="p" className="mb-4">
        <strong>Última actualización:</strong> 26-02-2026
      </Typography>

      <div className="mb-8">
        <Typography variant="h3" className="mb-4 font-bold">
          1. Responsable del tratamiento
        </Typography>
        <Typography variant="p" className="mb-4">
          El presente sistema de gestión de turnos online (en adelante, el “Sistema”) es operado por:
        </Typography>
        <Typography variant="p" className="mb-4">
          <strong>Titular:</strong> NodoApp<br />
          <strong>Domicilio:</strong> Ciudad Autónoma de Buenos Aires, Argentina<br />
          <strong>Correo electrónico de contacto:</strong> 
          <Link href="mailto:turnos.nodoapp@gmail.com" className="ml-1">turnos.nodoapp@gmail.com</Link><br />
          <strong>WhatsApp de contacto:</strong> 
          <Link href="https://wa.me/541173740338" className="ml-1">11 7374 0338</Link>
        </Typography>
        <Typography variant="p">
          El responsable del tratamiento de los datos personales es quien explota el Sistema y pone a disposición la plataforma para la gestión de turnos.
        </Typography>
      </div>

      <div className="mb-8">
        <Typography variant="h3" className="mb-4 font-bold">
          2. Datos personales recolectados
        </Typography>
        <Typography variant="p" className="mb-4">
          El Sistema recolecta únicamente los datos necesarios para la correcta gestión de turnos, que pueden incluir:
        </Typography>
        <ul className="list-disc pl-6 mb-4">
          <li><Typography variant="p">Nombre y apellido</Typography></li>
          <li><Typography variant="p">Número de teléfono (incluyendo WhatsApp)</Typography></li>
          <li><Typography variant="p">Dirección de correo electrónico</Typography></li>
          <li><Typography variant="p">Información relativa al turno solicitado (servicio, profesional, fecha y hora)</Typography></li>
        </ul>
        <Typography variant="p">
          No se recolectan datos sensibles en los términos del artículo 2 de la Ley 25.326, salvo que el profesional independiente que utilice el Sistema los requiera bajo su exclusiva responsabilidad.
        </Typography>
      </div>

      <div className="mb-8">
        <Typography variant="h3" className="mb-4 font-bold">
          3. Finalidad del tratamiento
        </Typography>
        <Typography variant="p" className="mb-4">
          Los datos personales son recolectados con las siguientes finalidades:
        </Typography>
        <ul className="list-disc pl-6 mb-4">
          <li><Typography variant="p">Gestionar solicitudes de turnos.</Typography></li>
          <li><Typography variant="p">Enviar confirmaciones y recordatorios.</Typography></li>
          <li><Typography variant="p">Permitir reprogramaciones o cancelaciones.</Typography></li>
          <li><Typography variant="p">Brindar soporte al usuario.</Typography></li>
          <li><Typography variant="p">Cumplir obligaciones legales.</Typography></li>
        </ul>
        <Typography variant="p">
          Los datos no serán utilizados para finalidades distintas o incompatibles con las aquí descriptas.
        </Typography>
      </div>

      <div className="mb-8">
        <Typography variant="h3" className="mb-4 font-bold">
          4. Base legal del tratamiento
        </Typography>
        <Typography variant="p" className="mb-4">
          El tratamiento de datos se realiza conforme al consentimiento libre, expreso e informado del titular de los datos, de acuerdo con lo establecido en la Ley 25.326.
        </Typography>
        <Typography variant="p">
          Al solicitar un turno, el usuario presta su consentimiento para el tratamiento de sus datos personales conforme a la presente Política.
        </Typography>
      </div>

      <div className="mb-8">
        <Typography variant="h3" className="mb-4 font-bold">
          5. Integración con WhatsApp
        </Typography>
        <Typography variant="p" className="mb-4">
          El Sistema utiliza la infraestructura de mensajería provista por <strong>WhatsApp Business Platform</strong>, servicio operado por <strong>Meta Platforms</strong>, para el envío de:
        </Typography>
        <ul className="list-disc pl-6 mb-4">
          <li><Typography variant="p">Confirmaciones de turno</Typography></li>
          <li><Typography variant="p">Recordatorios</Typography></li>
          <li><Typography variant="p">Notificaciones relacionadas exclusivamente con la gestión del turno</Typography></li>
        </ul>
        <Typography variant="p" className="mb-4">
          Al proporcionar su número telefónico y solicitar un turno, el usuario acepta recibir comunicaciones automatizadas relacionadas con dicho turno a través de WhatsApp.
        </Typography>
        <Typography variant="p">
          El Sistema no vende ni comparte datos personales con Meta para fines publicitarios propios. El tratamiento de datos realizado por WhatsApp se encuentra sujeto a sus propios términos y políticas de privacidad.
        </Typography>
      </div>

      <div className="mb-8">
        <Typography variant="h3" className="mb-4 font-bold">
          6. Almacenamiento y seguridad
        </Typography>
        <Typography variant="p" className="mb-4">
          Los datos personales son almacenados en servidores con medidas de seguridad técnicas y organizativas adecuadas para protegerlos contra el acceso no autorizado, alteración, pérdida o tratamiento indebido.
        </Typography>
        <Typography variant="p">
          Se adoptan prácticas razonables de seguridad conforme al artículo 9 de la Ley 25.326.
        </Typography>
      </div>

      <div className="mb-8">
        <Typography variant="h3" className="mb-4 font-bold">
          7. Cesión de datos
        </Typography>
        <Typography variant="p" className="mb-4">
          Los datos personales no serán cedidos ni comercializados a terceros, salvo:
        </Typography>
        <ul className="list-disc pl-6 mb-4">
          <li><Typography variant="p">Cuando sea necesario para la prestación del servicio (ej. WhatsApp).</Typography></li>
          <li><Typography variant="p">Por requerimiento judicial o autoridad competente.</Typography></li>
          <li><Typography variant="p">Con consentimiento expreso del titular.</Typography></li>
        </ul>
      </div>

      <div className="mb-8">
        <Typography variant="h3" className="mb-4 font-bold">
          8. Derechos del titular de los datos
        </Typography>
        <Typography variant="p" className="mb-4">
          El titular de los datos personales tiene derecho a acceder, rectificar, actualizar y suprimir sus datos.
        </Typography>
        <Typography variant="p" className="mb-4 italic">
          “El titular podrá en cualquier momento solicitar el retiro o bloqueo de su nombre de los bancos de datos.” (Art. 14, inc. 3, Ley 25.326).
        </Typography>
        <Typography variant="p">
          Las solicitudes deberán enviarse a: <Link href="mailto:turnos.nodoapp@gmail.com">turnos.nodoapp@gmail.com</Link>
        </Typography>
      </div>

      <div className="mb-8">
        <Typography variant="h3" className="mb-4 font-bold">
          9. Conservación de los datos
        </Typography>
        <Typography variant="p">
          Los datos serán conservados únicamente durante el tiempo necesario para cumplir con la finalidad para la cual fueron recolectados, o mientras exista una relación activa con el usuario.
        </Typography>
      </div>

      <div>
        <Typography variant="h3" className="mb-4 font-bold">
          10. Modificaciones
        </Typography>
        <Typography variant="p">
          El responsable se reserva el derecho de modificar la presente Política para adaptarla a novedades legislativas o mejoras del servicio.
        </Typography>
      </div>

    
        </Section>
        <Footer />
            </div>
    )
}