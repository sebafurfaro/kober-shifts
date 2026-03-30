/**
 * URL de la pantalla de autorización OAuth de Mercado Pago.
 *
 * Debe coincidir con el **país de la aplicación** creada en Mercado Pago Developers.
 * Usar `auth.mercadopago.com` (sin TLD de país) suele devolver **403** para apps regionales.
 *
 * - Argentina: `https://auth.mercadopago.com.ar/authorization` (default)
 * - Brasil: `https://auth.mercadopago.com.br/authorization`
 * - México: `https://auth.mercadopago.com.mx/authorization`
 * - Chile: `https://auth.mercadopago.cl/authorization`
 * - Colombia: `https://auth.mercadopago.com.co/authorization`
 *
 * Override: variable de entorno `MERCADOPAGO_OAUTH_AUTH_URL` (URL completa hasta `/authorization`).
 */
export function getMercadoPagoOAuthAuthorizationPageUrl(): string {
  const fromEnv = process.env.MERCADOPAGO_OAUTH_AUTH_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }
  return "https://auth.mercadopago.com.ar/authorization";
}
