## Seccion Cliente/Paciente

# Flujo deseable
- Sistema de Steps, no se puede avanzar los steps si no estan completos. 
- Step 1: Seleccion de servicio
- Step 2: Seleccion de profesional
- Step 3: Seleccion de Fecha y hora
- Confirmar/Cancelar

# Seleccion de fecha y hora
- El cliente debera visualizar la opcion: Ver turnos disponibles o Seleccionar por fecha. 
- Turnos disponibles: se despliega un grid de 5x5 y un paginado "Ver mas"
- Seleccion por fecha: <DatePicker> que tiene que tener unicamente, los turnos disponibles. 

# Casos de uso de seleccion por fecha
- Si Selecciona un dia que no tiene durnos, debera salir un mensaje de "No hay turnos disponibles ese dia"

# Confirmacion -> Flujo
- Tras confirmar Flujo, debe habilitarse un boton que diga "checkout" solo en caso que el servicio tenga un monto mayor 0. 
- Al seseleccionar checkout, lo debera redirigir a MercadoPago para realizar pago
- El turno debe quedar en estado pendiente, por un maximo de 6hs. 
- si el turno pendiente no se habilita pasadas esas 6hs, el turno queda liberado. 