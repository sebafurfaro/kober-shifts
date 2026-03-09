# Integración de email con Resend

La app envía correos de confirmación de turnos (y otros) usando **Resend** cuando está configurado, o SMTP como alternativa.

- [Documentación API Resend](https://resend.com/docs/api-reference/introduction)
- Base URL: `https://api.resend.com`
- Autenticación: header `Authorization: Bearer re_xxxxxxxxx` (API Key).
- **User-Agent**: Resend exige el header `User-Agent` en todas las peticiones; si falta, devuelve `403` (código 1010). La app envía por defecto `kober-shifts/1.0` o el valor de `RESEND_USER_AGENT`.

## Variables de entorno

| Variable           | Descripción |
|--------------------|-------------|
| `RESEND_API_KEY`   | API Key de Resend (formato `re_...`). Si está definida, se usa Resend para enviar. |
| `RESEND_FROM`      | Dirección remitente (ej. `"Tu Negocio <onboarding@resend.dev>"`). Si no se define, se usa `SMTP_FROM` o `no-reply@resend.dev`. |
| `RESEND_USER_AGENT`| Opcional. User-Agent enviado a la API (por defecto `kober-shifts/1.0`). |

## Modo desarrollo / dummy

- Sin `RESEND_API_KEY`: no se envía por Resend; si además no hay SMTP configurado, `sendMail` no hace nada (útil para desarrollo).
- Con `RESEND_API_KEY` y dominio de prueba de Resend (`onboarding@resend.dev`): podés probar envíos; Resend acepta el envío pero puede limitar destinatarios en plan free.

## Integración en producción

1. **Crear cuenta y API Key**  
   [Resend](https://resend.com) → API Keys → Create API Key. Copiá el valor `re_...` en `RESEND_API_KEY`.

2. **Dominio**  
   Para enviar desde tu propio dominio (ej. `no-reply@tudominio.com`):
   - En Resend: Domains → Add Domain.
   - Agregar los registros DNS que indique Resend (SPF, DKIM, etc.).
   - Cuando el dominio esté verificado, usar en `RESEND_FROM` una dirección de ese dominio.

3. **Variables en el servidor**  
   Configurar en el entorno de deploy:
   - `RESEND_API_KEY`
   - `RESEND_FROM` (con un remitente válido del dominio verificado).

4. **Límites**  
   Resend aplica [límites de tasa](https://resend.com/docs/api-reference/rate-limit) (por defecto 2 req/s por equipo). Errores `429` indican que se superó el límite.

## Dónde se usa en la app

- `lib/email.ts`: `sendMail()` y plantillas de contenido (`getTurnoConfirmadoPacienteContent`, `getTurnoConfirmadoProfesionalContent`).
- Envíos de “Turno confirmado”: confirmación manual (`appointments/[id]` PATCH) y webhook de Mercado Pago (pago de seña aprobado).
- “Turno solicitado”: `appointments/request` (POST).

El mensaje al paciente sigue la frase: *"El turno con {profesional} para el día {fecha+hora} en {sede} ha sido confirmado."*
