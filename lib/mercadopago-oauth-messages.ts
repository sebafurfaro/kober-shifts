export const MP_OAUTH_ERROR_MESSAGES: Record<string, string> = {
  missing_code_or_state: "Faltó código o estado en la respuesta de Mercado Pago.",
  server_config: "Mercado Pago no está configurado en el servidor.",
  token_exchange_failed:
    "No se pudo obtener el token. Revisá: (1) en Mercado Pago Developers, Redirect URI exacta igual a {tu dominio}/api/integrations/mercadopago/callback; (2) APP_URL en el servidor coincide con ese dominio; (3) credenciales de la aplicación (Client ID y Client Secret) son de esa misma app.",
  callback_failed: "Error al procesar la conexión.",
  oauth_not_configured:
    "Vincular con OAuth requiere MERCADOPAGO_CLIENT_ID y MERCADOPAGO_CLIENT_SECRET. Si ves 403 al abrir Mercado Pago, configurá MERCADOPAGO_OAUTH_AUTH_URL con el host de tu país (ej. Argentina: https://auth.mercadopago.com.ar/authorization). La cuenta MP del comercio debe ser del mismo país que la aplicación en Developers. Si en Developers activaste OAuth con PKCE, poné MERCADOPAGO_OAUTH_USE_PKCE=true en el servidor.",
};
