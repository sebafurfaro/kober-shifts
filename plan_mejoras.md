### Plan de Mejoras

## Login
- Hay un issue importante con los tenantId desconocidos. 
- La url armada a mano `{baseUrl}/plataforma/{tenantId}/`, si el tenantId no esta en la base de datos no se tiene que poder ingresar. 

## Page 404
- Crear una pagina 404 para handle de errores especificos
- Errores:
    - Si un tenantId no existe en la bd, al momento de hacer el request `{baseUrl}/plataforma/{tenantId}/` redirigir al usuario a la pantalla 404 con mensaje "El negocio que está buscando no se encuentra disponible, comuniquese con el dueño".

## Seccion Admin - Detalles
- Componente: `/panel/admin/components/admin/DetailsTab.tsx`
- Mejoras:
    - El estado inicial sitio debe ser inactivo.
    - Mejorar la actualizacion del switch. Es como que se desactiva, pero se vuelve a activar. Revisar persistencia del cambio en el context.

## Section Admin - Ajustes
- Componente: `/panel/admin/componentts/admin/SettingsTab.tsx`
- Mejoras:
    - <Input name="maxAnticipation" /> al borrar el primer digito el mismo se vuelve a escribir. Es necesario poder borrarlo para que el usuario ingrese el valor numerico que desee. 

## Section Admin - Integraciones
- Componente: `/panel/admin/components/admin/IntegrationsTab.tsx`
- Mejoras:
    - La integracion con MercadoPago, por defecto, para cada nuevo partner debe ir desvinculada. SOLO si el usuario hace la vinculacion la misma debe aparecer vinculada. 
- Objetivo. La idea de integrar MercadoPago es que cada tenantId pueda integrar su cuenta de Mercado Pago. 


## Seccion roles
- Componente: `/panel/admin/roles/page.tsx`
- Mejoras:
    - Falta agregar un boton guardar
    - Agregar tooltips 
    - Agregar un checkbox que permita seleccionar todos los permisos o deseleccionar. 
    - El usuario admin no deberia poder modificar sus permisos.

## Confirmacion turnos
- Componente `/panel/admin/components/admin/SettingsTab.tsx` tiene un <Switch> para el estado `manualTurnConfirmation` que por defecto esta con valor `false`. 
- Escenarios:
    - Sin señas, y con `manualTurnConfirmation`false, los turnos deben confirmarse automaticamente.
    - Sin señas y con `manualTurnConfirmation` true, los turnos deben quedar en estado pendiente
    - Con sistema de señas, `manualTurnConfirmation` queda sin efecto, el turno queda pendiente hasta que se confirme el pago de la seña. 

