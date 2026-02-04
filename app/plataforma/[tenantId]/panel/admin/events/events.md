## Seccion Eventos

# 1. UI
- Ubicado en <Aside>
- Utilizara el icono <CalendarCheck2 />
- El label sera "Turnos"
- Tendra un <PanelHeader title="Turnos" subtitle="Podras ver todos los turnos registrados">
- <Card> como en el resto de las secciones
- Filtros de Proximos, Hoy, Maniana, Todos. 
- Mostrara un total de 10 turnos paginados
- Utilizara <Table> y <Pagination>

# 2. Descripcion Funcional
Se podran ver todos los turnos registrados. En la parte superior de la estaran los filtros para ayudar al usuario a organizar la informacion de manera mas clara.

- Proximos: Los turnos con fecha futura, ordenados desde el mas cercano al mas lejano. Incluye unicamente aquellos que estan en estado confirmado o pendiente. 
- Hoy: muestra todos los turnos programados para hoy
- Mañana: muestra todos los turnos programados para Mañana 
- Todos: permite ver todos los turnos, sin importar la fecha o el estado en que se encuentren.

# 3. Informacion de la tabla
- La sucursal donde se realiza
- El servicio elegido
- El profesional asignado
- Nombre del cliente (Nombre y Apellido)
- La fecha y hora del turno
- El precio total del servicio
- El monto de la senia requerido (si aplica)
- El estado actual del turno (pendiente, confirmado, cancelado, atendido)
- Acciones

# 3.1 Tipos de Estado de turno
- Confirmado: El turno esta activo y fue confirmado correctamente. Esta reservado y en espera de ser atendido
- Pendiente: El turno fue solicitado pero aun no esta confirmado. Puede requerir accion adicional, como el pago de la senia o aprobacion manual
- Cancelado: El turno fue cancelado, ya sea por el cliente o por el negocio. No sera atendido.
- Atendido: El turno fue tomado por el cliente y se confirmo, o por accion manual o por accion automatica cumplido el tiempo de la misma. 

# 3.2 Acciones de los turnos
Las acciones se deben mostrar siempre.
- Confirmar: habilitada para turnos en estado pendiente, usar <CircleCheck> en success
- Cancelar: habilitada para estado pendiente y confirmado, usar <CircleX> en danger
- Tomado: habilitado para estado confirmado, usar <Hand> en primary
- Whtsapp: habiliatado para todos los estados, usar <MessageCircle> en color emerald-500

# 4. Lineamientos tecnicos
- Parte de la informacion ya esta creada en la base de datos, si es necesario crear un endpoint especifico que consuma todo
- Solo debe estar disponible para los roles Admin y Professional. 
- Agregar <Tooltips content={action.name} placement="top"> a los botones de las acciones con el nombre de la accion, se debe disparar 