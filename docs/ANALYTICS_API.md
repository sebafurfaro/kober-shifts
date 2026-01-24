# API de Analíticas de Turnos

Este documento describe los endpoints disponibles para la sección de analíticas de turnos, que está disponible únicamente para usuarios con rol `ADMIN` o `PROFESSIONAL`.

## Autenticación

Todos los endpoints requieren:
- Sesión válida (cookie de autenticación)
- El `tenantId` debe coincidir con el `tenantId` de la sesión
- El usuario debe tener rol `ADMIN` o `PROFESSIONAL`

## Endpoints

### 1. Estadísticas Generales

**Endpoint:** `GET /api/plataforma/[tenantId]/analytics/stats`

**Descripción:** Obtiene estadísticas generales sobre pacientes y turnos agrupados por día, semana y mes.

**Respuesta:**

```json
{
  "totalPatients": 150,
  "daily": [
    {
      "date": "2026-01-15",
      "count": 12
    },
    {
      "date": "2026-01-16",
      "count": 8
    }
  ],
  "weekly": [
    {
      "year": 2026,
      "week": 2,
      "count": 45
    },
    {
      "year": 2026,
      "week": 3,
      "count": 52
    }
  ],
  "monthly": [
    {
      "year": 2025,
      "month": 12,
      "count": 320
    },
    {
      "year": 2026,
      "month": 1,
      "count": 280
    }
  ]
}
```

**Campos:**
- `totalPatients`: Número total de pacientes registrados en el tenant
- `daily`: Array de turnos por día (últimos 30 días)
  - `date`: Fecha en formato `YYYY-MM-DD`
  - `count`: Cantidad de turnos en ese día
- `weekly`: Array de turnos por semana (últimas 12 semanas)
  - `year`: Año
  - `week`: Número de semana (según ISO 8601, semana 1)
  - `count`: Cantidad de turnos en esa semana
- `monthly`: Array de turnos por mes (últimos 12 meses)
  - `year`: Año
  - `month`: Número de mes (1-12)
  - `count`: Cantidad de turnos en ese mes

**Códigos de Estado:**
- `200`: Éxito
- `401`: No autorizado (sesión inválida o tenantId no coincide)
- `403`: Prohibido (rol no es ADMIN ni PROFESSIONAL)
- `500`: Error del servidor

---

### 2. Listado de Pacientes con Estadísticas

**Endpoint:** `GET /api/plataforma/[tenantId]/analytics/patients`

**Descripción:** Obtiene un listado paginado de pacientes con sus estadísticas de turnos (totales y cancelados), ordenable por diferentes criterios.

**Parámetros de Query:**
- `page` (opcional, default: `1`): Número de página
- `limit` (opcional, default: `10`): Cantidad de resultados por página
- `sortBy` (opcional, default: `"totalAppointments"`): Criterio de ordenamiento
  - `"totalAppointments"`: Ordenar por cantidad total de turnos (descendente)
  - `"cancelledAppointments"`: Ordenar por cantidad de turnos cancelados (descendente)

**Ejemplo de Request:**
```
GET /api/plataforma/tenant123/analytics/patients?page=1&limit=10&sortBy=totalAppointments
```

**Respuesta:**

```json
{
  "patients": [
    {
      "id": "user123",
      "name": "Juan Pérez",
      "firstName": "Juan",
      "lastName": "Pérez",
      "email": "juan@example.com",
      "phone": "+5491112345678",
      "totalAppointments": 25,
      "cancelledAppointments": 3
    },
    {
      "id": "user456",
      "name": "María García",
      "firstName": "María",
      "lastName": "García",
      "email": "maria@example.com",
      "phone": null,
      "totalAppointments": 18,
      "cancelledAppointments": 1
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "totalPages": 15
  }
}
```

**Campos:**
- `patients`: Array de objetos paciente
  - `id`: ID único del paciente
  - `name`: Nombre completo (fallback si no hay firstName/lastName)
  - `firstName`: Primer nombre (opcional)
  - `lastName`: Apellido (opcional)
  - `email`: Email del paciente
  - `phone`: Teléfono (opcional, puede ser `null`)
  - `totalAppointments`: Cantidad total de turnos del paciente
  - `cancelledAppointments`: Cantidad de turnos cancelados del paciente
- `pagination`: Información de paginación
  - `page`: Página actual
  - `limit`: Resultados por página
  - `total`: Total de pacientes
  - `totalPages`: Total de páginas

**Códigos de Estado:**
- `200`: Éxito
- `401`: No autorizado (sesión inválida o tenantId no coincide)
- `403`: Prohibido (rol no es ADMIN ni PROFESSIONAL)
- `500`: Error del servidor

---

## Notas de Implementación

### Filtrado por Rol

Los endpoints automáticamente filtran los datos según el rol del usuario:
- **ADMIN**: Ve todos los datos del tenant
- **PROFESSIONAL**: Ve todos los datos del tenant (actualmente igual que ADMIN, pero puede modificarse en el futuro para filtrar solo sus propios turnos)

### Agregaciones de Fechas

- **Diario**: Los turnos se agrupan por `DATE(startAt)` (últimos 30 días)
- **Semanal**: Los turnos se agrupan por `YEAR(startAt), WEEK(startAt, 1)` (últimas 12 semanas)
- **Mensual**: Los turnos se agrupan por `YEAR(startAt), MONTH(startAt)` (últimos 12 meses)

### Ordenamiento de Pacientes

El ordenamiento se realiza en la base de datos:
- Si `sortBy = "totalAppointments"`: Ordena por `totalAppointments DESC, cancelledAppointments DESC`
- Si `sortBy = "cancelledAppointments"`: Ordena por `cancelledAppointments DESC, totalAppointments DESC`

### Consideraciones de Rendimiento

- Las consultas utilizan índices en `appointments.tenantId`, `appointments.patientId`, y `appointments.startAt`
- Para tenants con muchos datos, considerar agregar límites de tiempo más estrictos o implementar caché

---

## Modificaciones Futuras

### Top 10 Prestaciones Más Usadas

Este endpoint está planificado pero aún no implementado. Cuando se implemente, debería:

**Endpoint:** `GET /api/plataforma/[tenantId]/analytics/services/top`

**Respuesta esperada:**
```json
{
  "services": [
    {
      "specialtyId": "spec123",
      "specialtyName": "Cardiología",
      "count": 45
    }
  ]
}
```

---

## Ejemplos de Uso

### Obtener estadísticas generales
```javascript
const response = await fetch('/api/plataforma/tenant123/analytics/stats', {
  credentials: 'include'
});
const stats = await response.json();
console.log(`Total pacientes: ${stats.totalPatients}`);
```

### Obtener pacientes ordenados por turnos cancelados
```javascript
const response = await fetch(
  '/api/plataforma/tenant123/analytics/patients?page=1&limit=10&sortBy=cancelledAppointments',
  { credentials: 'include' }
);
const data = await response.json();
console.log(`Total páginas: ${data.pagination.totalPages}`);
```
