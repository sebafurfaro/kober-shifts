export const MP_OAUTH_ERROR_MESSAGES: Record<string, string> = {
  missing_code_or_state: "Faltó código o estado en la respuesta de Mercado Pago.",
  server_config: "Mercado Pago no está configurado en el servidor.",
  token_exchange_failed:
    "No se pudo obtener el token. Verificá que APP_URL coincida con la URL de redirección registrada en tu aplicación de Mercado Pago Developers (debe ser exactamente la misma base, p. ej. https://tudominio.com).",
  callback_failed: "Error al procesar la conexión.",
  oauth_not_configured:
    "Vincular con OAuth requiere MERCADOPAGO_CLIENT_ID y MERCADOPAGO_CLIENT_SECRET (creá una aplicación en Mercado Pago Developers). Si solo usás credenciales globales en el servidor, configurá MERCADOPAGO_ACCESS_TOKEN.",
};
