export const MP_OAUTH_ERROR_MESSAGES: Record<string, string> = {
  missing_code_or_state: "Faltó código o estado en la respuesta de Mercado Pago.",
  /** MP suele devolver esto si Client ID, redirect URI o PKCE no coinciden con la app en Developers. */
  invalid_request:
    "Mercado Pago rechazó la solicitud OAuth (invalid_request). Revisá Redirect URI, PKCE en servidor vs panel de Developers y país de la app.",
  access_denied: "Autorización cancelada o denegada en Mercado Pago.",
  server_config: "Mercado Pago no está configurado en el servidor.",
  token_exchange_failed:
    "No se pudo obtener el token. Revisá: (1) En Mercado Pago Developers, la Redirect URI debe ser exactamente https://TU_DOMINIO/api/integrations/mercadopago/callback (mismo esquema, host y ruta; sin barra final). (2) Definí MERCADOPAGO_OAUTH_BASE_URL o APP_URL en el servidor con ese mismo origen (útil si hay www vs dominio raíz o proxy). (3) Client ID y Secret de esa misma aplicación. (4) Si activaste PKCE en la app, MERCADOPAGO_OAUTH_USE_PKCE=true en el servidor.",
  callback_failed: "Error al procesar la conexión.",
  oauth_not_configured:
    "Vincular con OAuth requiere MERCADOPAGO_CLIENT_ID y MERCADOPAGO_CLIENT_SECRET. Si ves 403 al abrir Mercado Pago, configurá MERCADOPAGO_OAUTH_AUTH_URL con el host de tu país (ej. Argentina: https://auth.mercadopago.com.ar/authorization). La cuenta MP del comercio debe ser del mismo país que la aplicación en Developers. Si en Developers activaste OAuth con PKCE, poné MERCADOPAGO_OAUTH_USE_PKCE=true en el servidor.",
};
