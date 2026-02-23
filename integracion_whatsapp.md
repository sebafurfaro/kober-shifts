## Plan de accion integracion whatsapp business

# Token de acceso
- EAARbt62OYhUBQ6QiUsfz3DKGS707j8xZBflI0DPt6ZCy10hGTAinUQ4ktQIvV6pfkCDNUZBk0oiHirwNqMyzsUnFoCcGlWhtaOfEQeZBDIK1pAtQHnBVnZAqpD95hklaZA5FCb1n9ANRCdgZBw5CI40V8kLDQMvxVNdlSXaZBi74m6IM6epjLBZA9BaqFNplkQ6wZAFO36uxVWsAF4ZADZAqtuMO9WcYVpgtix8Rj9HZCPDmtNJEcKURb9C2LeiWd8ZCrhEud5anNx6ZCPt3avAn79PC9Q06v1M1QZDZD

# token de app
EAARbt62OYhUBQ16d6jDIdZCd5TAqimaVfjBGLJZB2ygVZA3KDrFsJTc7hrG4Od3zVqW2v0qBIPGWSlWASgzzSqQAZA3mO8aFqwpQdGlPcbyQ14HMNJaNCKHk4GaAXzZCx56l4ZAhIDNjUnS5Ck93MDnG42f2TZAi88HJSGiNXyn7U3RZCZAIWw7oQPtqXknFt41aJdAZDZD

# Datos para integracion
- Numero de prueba origen: 15551623346
- numero de prueba destino: 1522390724
- Documentacion oficial: https://developers.facebook.com/documentation/business-messaging/whatsapp/access-tokens#system-user-access-tokens

# Objetivos de la integracion
- El objetivo es poder enviar recordatorios de whatsapp a los clientes/pacientes. Los recordatorios estan delimitados por:
    - Habilitacion de feature flag (contratacion de un pack de x cantidad de envios mensuales)
    - Limite disponible. Ejemplo: si el cliente tiene contratado un pack de 50 recordatorios por mes, solo puede utilizar 50 recordatorios por mes. En caso que un mes haya utilizado 20 recordatorios, al mes siguiente tendra 80, 30 recordatorios de un mes sin uso mas 50 del nuevo mes. 
    - 
- El mensaje debera ser:
``
Hola {{nombre_cliente}} ✨
Ya casi es tu turno en {{lugar}}.

🧑‍🎨 {{servicio}} con {{profesional}}
📅 {{fecha}} a las {{hora}}

Si necesitás hacer algún cambio, podés gestionarlo desde tu cuenta.
¡Nos vemos pronto!
``

- Agregar la posibilidad de capturar el texto del mensaje de forma dinamica o bien, este mensaje por defecto. 