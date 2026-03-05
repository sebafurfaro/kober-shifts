# Análisis del Plan de Mejoras – Por dónde empezar

Este documento prioriza los ítems del `plan_mejoras.md` por **simplicidad de implementación**, para que puedas arrancar por lo más rápido y visible.

---

## Más simples (empezar por aquí)

### 1. **Ajustes – Input maxAnticipation** (SettingsTab)
- **Problema:** Al borrar el primer dígito, el valor se reescribe (no se puede dejar vacío para escribir otro número).
- **Causa:** En `onValueChange`, cuando el input queda vacío (`""`), se usa `parseInt(v, 10) || 30` y vuelve a 30.
- **Solución:** Manejar el input como string mientras se escribe y solo convertir a número al salir del campo (onBlur) o al guardar. Permitir string vacío en el estado local del campo.
- **Esfuerzo:** Bajo (cambios solo en `SettingsTab.tsx`).

---

### 2. **Detalles – Estado inicial sitio inactivo** (DetailsTab)
- **Problema:** El estado inicial del negocio debería ser inactivo.
- **Causa:** Al cargar desde la API, si `data.isActive` no es estrictamente `boolean`, se usa `true`:  
  `setIsActive(typeof data.isActive === "boolean" ? data.isActive : true)`.
- **Solución:** Tratar “activo” solo cuando la API devuelve explícitamente `true`. Por ejemplo:  
  `setIsActive(data.isActive === true)` (y si `data` no tiene `isActive`, no hacer set o usar `false`). Así, tenant nuevo o sin valor queda inactivo.
- **Esfuerzo:** Bajo (una línea en el `useEffect` de carga en `DetailsTab.tsx`).

---

### 3. **Integraciones – MercadoPago desvinculado por defecto**
- **Problema:** Para cada nuevo partner, MercadoPago debe mostrarse desvinculado; solo vinculado si el usuario completó la vinculación.
- **Causa:** En `integrations/mercadopago/status/route.ts` se devuelve `linked = oauthLinked || !!envToken`. Si existe `MERCADOPAGO_ACCESS_TOKEN` global, todos ven “vinculado”.
- **Solución:** Para la UI de Integraciones, considerar solo la vinculación por tenant: devolver `linked: oauthLinked` (no sumar el token de env). Los cobros pueden seguir usando el token de env como fallback por detrás, pero la pantalla mostrará “vinculado” solo cuando ese tenant tenga OAuth.
- **Esfuerzo:** Bajo (cambio en el GET de `status/route.ts`).

---

### 4. **Roles – Botón Guardar**
- **Problema:** Falta un botón para guardar los permisos.
- **Solución:** Agregar un botón “Guardar” (por ejemplo debajo de la tabla) que por ahora llame a la misma lógica que quieras usar para persistir (el TODO que ya está en el código). Si aún no hay API de persistencia, el botón puede quedar deshabilitado o mostrar un “Próximamente” hasta tener el endpoint.
- **Esfuerzo:** Bajo (solo UI en `roles/page.tsx`).

---

### 5. **Roles – Tooltips**
- **Problema:** Agregar tooltips en la sección de roles.
- **Solución:** En cada header de columna (Permiso, Administrador, Profesional, Recepcionista) y/o en cada fila/permiso, agregar un `Tooltip` (HeroUI) con una descripción breve del permiso o del rol.
- **Esfuerzo:** Bajo (solo marcado y textos en `roles/page.tsx`).

---

## Simples (siguiente tanda)

### 6. **Detalles – Persistencia del Switch (se desactiva y se vuelve a activar)**
- **Problema:** El switch de “Permitir reservas” se desactiva pero parece volver a activarse.
- **Posibles causas:** (a) El GET de settings devuelve un valor distinto al que se guardó (por defecto o caché). (b) El store (`useTenantBusinessStore`) se rehidrata o se actualiza desde otro lado y pisa `isActive`. (c) Doble render y el valor por defecto `true` en algún lado.
- **Solución:** Revisar en orden: (1) que el PUT de settings persista y el GET devuelva ese valor; (2) que después del PUT solo se actualice el store con la respuesta; (3) que el estado inicial por defecto sea `false` (ya cubierto en el punto 2) y que no haya otro lugar que fuerce `true`.
- **Esfuerzo:** Bajo–medio (revisar flujo en `DetailsTab`, store y API de settings).

---

### 7. **Roles – Checkbox “seleccionar todos / deseleccionar”**
- **Problema:** Un checkbox que marque o desmarque todos los permisos de una columna (por rol) o de una fila (por permiso).
- **Solución:** Una fila extra en el header con un checkbox por columna (por rol) que, al cambiar, ponga todos los permisos de ese rol en 1 o en 0. Opcional: otro checkbox por fila (por permiso) que marque/desmarque ese permiso en todos los roles. Reutilizar `handleChange` o una variante.
- **Esfuerzo:** Bajo–medio (lógica en estado + 1–2 checkboxes en `roles/page.tsx`).

---

### 8. **Página 404**
- **Problema:** Crear una página 404 para errores específicos (por ejemplo tenant inexistente).
- **Solución:** Crear `app/plataforma/[tenantId]/not-found.tsx` (o la ruta que use tu app para 404) con el mensaje: “El negocio que está buscando no se encuentra disponible, comuníquese con el dueño.” Si quieres una 404 global, usar `app/not-found.tsx`.
- **Esfuerzo:** Bajo (una página estática con mensaje y opcionalmente layout).

---

## Medios (después de los anteriores)

### 9. **Login / tenantId desconocido + redirección a 404**
- **Problema:** Si el `tenantId` no está en la base, no se debe poder ingresar; y al intentar acceder a `{baseUrl}/plataforma/{tenantId}/` con tenant inexistente, redirigir a la 404 con el mensaje del negocio.
- **Solución:** En el layout o en una página de `plataforma/[tenantId]`, hacer una validación (por ejemplo un GET a una API que verifique si el tenant existe). Si no existe, `redirect()` a la ruta de la 404 (o a `/plataforma/not-found` con query/mensaje). En login, si el usuario escribe un tenant que no existe, no permitir continuar y mostrar error o redirigir a 404.
- **Esfuerzo:** Medio (API o función de validación de tenant + redirección en layout o página + posible ajuste en login).

---

### 10. **Roles – El admin no debería modificar sus propios permisos**
- **Problema:** El usuario admin no debe poder cambiar sus propios permisos.
- **Solución:** Necesitás el userId (o email) del usuario actual (session o contexto). En la tabla de roles, si hay una fila “este usuario” (por ejemplo por userId), deshabilitar los checkboxes de esa fila, o no mostrar esa fila para “mis permisos”. Si los roles se editan por rol (ADMIN, PROFESSIONAL, etc.) y el usuario actual es ADMIN, habría que deshabilitar solo la columna “Administrador” para no permitir quitarse permisos a sí mismo (o deshabilitar toda la edición cuando el usuario es el único admin). Definir bien la regla de negocio (¿solo no tocar “admin” cuando soy yo?, ¿o no tocar ninguna fila cuando soy yo?).
- **Esfuerzo:** Medio (session/contexto + regla de negocio + deshabilitar celdas o columnas).

---

### 11. **Confirmación de turnos (manualTurnConfirmation + señas)**
- **Problema:** Tres escenarios: sin señas y confirmación manual false → auto-confirmar; sin señas y true → pendiente; con señas → pendiente hasta pago de seña (manualTurnConfirmation sin efecto).
- **Solución:** Revisar el flujo donde se crea o actualiza el turno (request de turno, webhook de pago, confirmación manual): según configuración del tenant (señas sí/no, `manualTurnConfirmation`) decidir el status inicial (CONFIRMED vs REQUESTED) y cuándo pasar a CONFIRMED. Probablemente tocar backend (API de appointment request y/o webhook) y tal vez un poco de UI (mensajes o estados).
- **Esfuerzo:** Medio (lógica en 1–2 rutas de API y pruebas de los 3 escenarios).

---

### 12. **Integración Mailsender**
- **Problema:** Mailsender necesita un dominio real para integrar la plataforma y enviar correos. Hasta no tener el deploy en el servidor final, no se puede testear en vivo.
- **Solución:** Crear un template con información dinámica para la confirmación de turnos, por ejemplo: *"El turno con {profesional} para el día {fecha+hora} en {sede} ha sido confirmado."* Centralizar ese texto en una función que reciba las variables (profesional, fecha, hora, sede) y usarla en los envíos actuales (confirmación manual, webhook Mercado Pago, etc.). Dejar la integración preparada con variables de entorno en modo dummy (sin dominio real) y documentar los pasos para la integración final (dominio, DNS, Mailsender/Resend/SMTP).
- **Esfuerzo:** Medio (template reutilizable + uso en rutas existentes que ya envían mail + documentación de env y deploy).
- **Contexto:** Ya existe `lib/email.ts` con `sendMail` y `renderBasicTemplate`; los mails de confirmación se envían desde `appointments/[id]/route.ts`, `payments/mercadopago/webhook/route.ts` y `appointments/request/route.ts`. El trabajo es unificar el mensaje en un template y documentar.

---

### 13. **Integración con WhatsApp**
- **Problema:** Enviar recordatorios por WhatsApp en tres modalidades configurables por el usuario: 24 h antes, 48 h antes, o ambos (24 h y 48 h antes del turno).
- **Solución:** Integrar con WhatsApp usando el número de prueba origen `15551623346` y tokens (token de acceso y token de app) configurables manualmente (dummy para desarrollo). Límites: feature flag por tenant (pack de X envíos mensuales); si el tenant tiene límite mensual (ej. 50 mensajes), no permitir excederlo (no acumular saldo de meses anteriores o sí, según regla de negocio). Opción de personalizar el texto del recordatorio o usar por defecto:

  ```
  Hola {{nombre_cliente}} ✨
  Ya casi es tu turno en {{lugar}}.

  🧑‍🎨 {{servicio}} con {{profesional}}
  📅 {{fecha}} a las {{hora}}

  Si necesitás hacer algún cambio, podés gestionarlo desde tu cuenta.
  ¡Nos vemos pronto!
  ```

- **Esfuerzo:** Alto (job/cron para enviar a 24 h y 48 h, contador de envíos por tenant/mes, feature flag y límites, configuración por tenant de 24h/48h/ambos, plantilla con variables, UI para personalizar mensaje, integración con API de WhatsApp Business).
- **Contexto:** Ver `integracion_whatsapp.md` con número de prueba y documentación oficial. IntegracionesTab ya tiene un bloque “WhatsApp” con botón Activar; habrá que conectar con configuración por tenant y el envío programado.

---

## Resumen recomendado para empezar

| Orden | Ítem                         | Archivo(s) principal(es)              | Dificultad   | Estado      |
|-------|------------------------------|----------------------------------------|--------------|-------------|
| 1     | maxAnticipation borrable     | `SettingsTab.tsx`                      | Muy baja     | Implementado |
| 2     | Estado inicial sitio inactivo| `DetailsTab.tsx`                       | Muy baja     | Implementado |
| 3     | MercadoPago desvinculado     | `integrations/mercadopago/status/route.ts` | Muy baja  | Implementado |
| 4     | Roles – Botón Guardar        | `roles/page.tsx`                       | Baja         | Implementado |
| 5     | Roles – Tooltips             | `roles/page.tsx`                       | Baja         | Implementado |
| 6     | DetailsTab persistencia Switch | `DetailsTab.tsx` + API settings     | Baja–media   | Implementado |
| 7     | Roles – Checkbox todos       | `roles/page.tsx`                       | Baja–media   | Pendiente   |
| 8     | Página 404                   | `not-found.tsx` (ruta a definir)       | Baja         | Pendiente   |
| 9     | Login / tenantId + 404       | layout, API tenant, login              | Medio        | Pendiente   |
| 10    | Roles – Admin no modifica sus permisos | `roles/page.tsx` + session       | Medio        | Pendiente   |
| 11    | Confirmación turnos (manual + señas)  | API appointments, webhook         | Medio        | Pendiente   |
| 12    | Integración Mailsender       | `lib/email.ts`, rutas de turnos, docs  | Medio        | Pendiente   |
| 13    | Integración WhatsApp         | cron, API WhatsApp, tenant config, UI  | Alto         | Pendiente   |

Siguiente paso sugerido: puntos 4 y 5 (Roles – Botón Guardar y Tooltips) o punto 6 (persistencia del Switch en Detalles).
