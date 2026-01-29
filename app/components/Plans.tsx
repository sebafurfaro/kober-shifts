export const Plans = () => {

    const plans = [
        {
          name: "Starter",
          priceMonth: "$ 9.000",
          priceYear: "$ 99.000",
          description: "Ideal para comenzar.",
          badge: null,
          highlight: false,
          features: [
            "Sedes: 1",
            "Profesionales: Hasta 2",
            "Calendario mensual / semanal / diario",
            "Turnos ilimitados",
            "Gestión de clientes: Básica",
            "Especialidades",
            "Coberturas médicas",
            "Cobro de señas / pago total",
            "Integración MercadoPago",
            "Email de confirmación",
            "Recordatorios por WhatsApp: —",
            "Reportes: —",
            "Marca NodoApp visible",
            "Soporte: Básico",
          ],
        },
        {
          name: "Pro",
          price: "USD 25 / mes",
          description: "Para centros en crecimiento con más demanda.",
          badge: "POPULAR",
          highlight: true,
          features: [
            "Sedes: Hasta 3",
            "Profesionales: Hasta 10",
            "Calendario mensual / semanal / diario",
            "Turnos ilimitados",
            "Gestión de clientes: Avanzada",
            "Especialidades",
            "Coberturas médicas",
            "Cobro de señas / pago total",
            "Integración MercadoPago",
            "Email de confirmación",
            "Recordatorios por WhatsApp",
            "Reportes: Básicos",
            "Marca NodoApp visible: —",
            "Soporte: Prioritario",
          ],
        },
        {
          name: "Business",
          price: "Desde USD 59 / mes",
          description: "Pensado para clínicas y multi-sede.",
          badge: null,
          highlight: false,
          features: [
            "Sedes: Ilimitadas",
            "Profesionales: Ilimitados",
            "Calendario mensual / semanal / diario",
            "Turnos ilimitados",
            "Gestión de clientes: Avanzada",
            "Especialidades",
            "Coberturas médicas",
            "Cobro de señas / pago total",
            "Integración MercadoPago",
            "Email de confirmación",
            "Recordatorios por WhatsApp",
            "Reportes: Avanzados",
            "Marca NodoApp visible: —",
            "Soporte: Prioritario + SLA",
          ],
        },
      ];

    return(
        <section className="bg-white py-24">
            planes
        </section>
    )
}