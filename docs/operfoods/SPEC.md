# Spec: Operfoods para comida rápida de mostrador

Versión 1, 2026-10-02. Estado: propuesta de implementación para pilotos; no implementada.

## 1. Problema y usuarios

Durante la hora punta, un local toma pedidos por distintos canales, comunica cambios a cocina y cobra mientras llegan nuevos pedidos. El dueño necesita reducir olvidos y errores, ordenar la entrega y cerrar caja. Después necesita distinguir ventas de margen.

Usuarios: dueño/configurador, cajero/operador y personal de cocina. Reutilizar los roles existentes mientras alcancen; cualquier nuevo permiso de cocina debe permitir solo lo necesario. Cliente final: consulta menú, elige opciones y solicita retiro. Delivery propio queda disponible solo si funciona y el piloto lo necesita; no ampliar logística.

## 2. Base observada y límites

| Capacidad | Evidencia estática | Tratamiento |
|---|---|---|
| POS y pedidos activos | `app-frontend/src/app/(dashboard)/pos/` | Reutilizar y comprobar flujo completo |
| Menú público y creación de pedidos | `app-frontend/src/app/m/[slug]/PublicMenuClient.tsx`, `app-backend/src/modules/public/` | Reutilizar; probar opciones, precios y contexto |
| Estados de pedido | Página de pedidos activos y módulo `orders` | Validar también en servidor |
| Caja y movimientos | Módulo `cash-registers`, modelos `CashRegister` y `CashMovement` | Verificar conciliación y anulaciones |
| Recetas y costos | `orders/order.repository.ts`, modelos de recetas, `OrderItem.cost` | Completar calidad de datos y reportes |
| Eventos | `events/event.repository.ts` | Hoy margen = ventas - gastos registrados |
| WhatsApp | Enum/origen y etiquetas | No acreditan integración de mensajes |
| Alertas automáticas e impresión | Sin mecanismo localizado en revisión inicial | Trabajo propuesto; confirmar antes de implementar |

No hay validación funcional de estas capacidades. Revisar además las lecturas de pedidos montadas antes de `authenticate` en `order.routes.ts`; comprobar el alcance real de middleware y autorización. En eventos, revisar `getAnalytics`, `addExpense` y `listExpenses`: filtros de negocio incompletos en consultas observadas. Son candidatos a bloqueo de piloto hasta demostrar aislamiento correcto.

## 3. Alcance

Entrega A: operación segura para tres pilotos: cola de pedidos, actualización automática y alertas, cocina, comanda/ticket interno, POS móvil, demo y cierre de caja comprobado.

Entrega B: márgenes estimados confiables por producto/día, solo cuando se tengan recetas y costos reales de los pilotos. No bloquear entrevistas por esta entrega.

Fuera de alcance inicial: mesas, garzones, propinas, división de cuentas, kioskos/códigos de barras, apps nativas, chatbot de WhatsApp, integración con adquirentes, marketplace de delivery, motor de IA, expansión del sistema de casinos, autoservicio comercial completo y cálculo de utilidad contable definitiva. Emisión tributaria integrada queda condicionada al piloto: el comercio debe disponer de un flujo válido externo antes de operar.

## 4. Requisitos y aceptación

### RF-01. Captura consistente de pedidos — P0

El POS y el menú deben persistir un pedido con negocio, contexto, productos, opciones, cantidades, notas, total, origen y estado de pago independientes del estado de preparación. El servidor calcula precios y verifica que productos y opciones pertenezcan al negocio y estén disponibles. Una selección de tarjeta no acredita un cobro.

Aceptación: dos envíos con la misma clave de idempotencia producen un solo pedido, consumo y registro de pago; reutilizar esa clave con otro contenido se rechaza. Un error o pérdida de respuesta permite consultar/reintentar sin duplicar. Ninguna confirmación al cliente aparece antes de persistir. Rechazar referencias de otro negocio.

### RF-02. Cola y coordinación de cocina — P0

Mostrar pedidos pendientes por antigüedad, tiempo de espera, código de retiro, canal, productos, opciones y notas. Estados previstos: CREATED → CONFIRMED → PREPARING → READY → DELIVERED; cancelación con permiso y motivo según estado. Validar transiciones en servidor y separar cobro de preparación.

Aceptación: cajero y cocina ven el mismo resultado; dos operadores no sobrescriben cambios concurrentes silenciosamente. «Sin tomate» y extras se conservan desde captura hasta comanda. Pedidos terminales salen de la cola activa y quedan en historial. No exponer nombre/teléfono en una pantalla pública de retiro.

### RF-03. Actualización y alertas — P0

Para los pilotos, usar sondeo autenticado cada 3 segundos con consulta acotada y marca de actualización; evaluar SSE después solo si carga o latencia lo justifican. Recuperar snapshot al abrir, reconectar, volver al primer plano y cambiar de negocio/evento. No depender de actualización manual.

Aceptación objetivo: pedido persistido visible en ambas pantallas en ≤5 segundos en primer plano bajo la carga acordada en RF-09. Alerta visual y sonido por nuevo pedido; el usuario habilita audio mediante interacción y ve si está desactivado. No repetir sonidos por cada sondeo/reconexión. Los pendientes nunca desaparecen por no haber emitido sonido. Mostrar desconexión y antigüedad del último refresco. Probar el dispositivo real: no prometer alertas con navegador cerrado o suspendido.

### RF-04. Comanda y ticket interno — P0

Comanda: código, hora, retiro/delivery, cantidades, productos, opciones y notas destacadas. Ticket interno: detalle, total y pago registrado; indicar que no es boleta tributaria. Elegir un modelo de impresora y un dispositivo de piloto antes de desarrollar la integración.

Aceptación: impresión legible de caracteres españoles y pedidos largos, sin recortar notas; reimpresión identificada como copia, sin duplicar pedido. Impresión fallida no anula la venta y queda visible para reintento. El diálogo del navegador sirve para impresión manual; no anunciar impresión automática ni Bluetooth genérico sin validación de hardware. Si se requiere impresión automática, acotar y presupuestar puente local o SDK del proveedor como tarea adicional.

### RF-05. POS en dispositivos reales — P0

Diseñar para tablet y celular del piloto, botones utilizables, carrito visible y opciones sin desbordamiento. Preservar carrito ante errores recuperables. Un local de mostrador debe poder vender sin crear evento ni registrar cliente obligatorio innecesario.

Aceptación: venta de dos productos, uno con opciones, cobro y nueva venta en móvil sin desplazamiento horizontal ni bloqueo. Medir tiempo con operador real contra su flujo anterior. Sin conexión: bloquear confirmación y mostrar qué ocurrió; no simular funcionamiento offline. PWA/instalación será P1 si aporta al dispositivo elegido; instalar una app no implica operar sin red.

### RF-06. Caja, pagos y cancelaciones — P0

Validar fondo inicial, ventas por medio de pago, entradas/salidas, efectivo esperado, efectivo contado y diferencia por turno. Transferencia requiere comprobación del operador. Evitar contar pagos fallidos, duplicados o no realizados como dinero recibido. Definir cancelación antes/después de preparación, devolución y reversión de inventario de manera explícita; una cancelación posterior a cocinar no repone ingredientes como si no se hubieran usado.

Aceptación: escenario calculado manualmente coincide con cierre; anulaciones conservan motivo e historial. Reintentar una operación no duplica movimiento ni devolución. Cierre no confunde facturación, pagos y efectivo disponible.

### RF-07. Demo y puesta en marcha — P0

Negocio de demostración aislado con menú creíble de completos/sándwiches, opciones, pedidos, recetas y caja de ejemplo. Datos ficticios identificados; reset reproducible restringido a ese negocio. Configuración presencial: cargar carta revisada con dueño, precios/opciones, dispositivo, cocina, medio tributario externo, QR y primera venta.

Aceptación: demo en 3 minutos sin editar datos; medir instalación y apuntar a ≤60 minutos para carta pequeña ya preparada. El menú queda aprobado antes de publicar. No ofrecer importación desde foto ni instalación en 20 minutos como capacidades existentes.

### RF-08. Margen estimado — P1, entrega B

Conservar costo histórico por línea, opciones e ingredientes/envases. `calculateItemCost` recibe cantidad: comprobar y documentar que `OrderItem.cost` representa el total de la línea; no multiplicarlo dos veces. Un costo ausente es desconocido, no cero. Distinguir costo cero confirmado de receta incompleta.

Ingresos netos de descuentos y devoluciones, excluyendo cargos de delivery que no correspondan al producto. Asignar descuentos por línea con regla determinista y redondeo conciliado. Definir base tributaria: no mezclar ventas con IVA y costos sin IVA. En piloto mostrar «margen estimado sobre montos registrados» y su base; no llamarlo utilidad neta. Decidir normalización tributaria con los datos reales antes de mostrar porcentajes como comparables.

Margen de contribución = ingresos comparables - costo histórico de productos - comisiones variables. Resultado operativo estimado = contribución - gastos operativos registrados. Evitar contar compras de ingredientes otra vez como gasto además del consumo. Mermas independientes, sin duplicar las ya consumidas en pedidos.

Aceptación: venta con cantidad 2, extra, envase, descuento y devolución concilia con cálculo manual. Cambiar costo de ingrediente mañana no cambia el histórico. Reportar cobertura de costos (% de ingresos con costo completo) y advertencia; no ordenar «más rentable» con datos incompletos. Casos de costo faltante, cancelación, redondeo y venta de otro negocio probados.

### RF-09. Seguridad y operación — P0

Autenticación y permisos en pedidos/caja/cocina/reportes. Alcance de negocio derivado de usuario autorizado; contexto del navegador no concede acceso. Endpoints públicos entregan solo carta y permiten pedido con validaciones, límites de abuso y sin acceso a datos privados. Capturar únicamente datos necesarios del cliente.

Aceptación: pruebas con dos negocios impiden lectura/mutación cruzada por ID/query/contexto y acceso anónimo a pedidos privados. Respaldar y restaurar en base de prueba. Registrar fallos con ID de operación sin exponer secretos. Fecha local America/Santiago para días/turnos; almacenamiento temporal consistente.

Carga provisional de prueba: 2 pantallas, 20 pedidos nuevos en 5 minutos, 100 pedidos activos; ajustar al local observado. Verificar actualización, ausencia de duplicados y tiempos de respuesta; no representa capacidad máxima del producto. Preparar ruta de contingencia en papel ante caída, contacto de soporte y versión anterior recuperable.

## 5. Diseño técnico propuesto

Reutilizar Next.js/React, API Express/TypeScript, Sequelize/PostgreSQL y Controller → Service → Repository. No reescribir stack ni reemplazar autorización por una nueva implementación paralela.

Cambios de datos candidatos: clave de idempotencia única por negocio/operación y hash de payload; versión de pedido para concurrencia; historial de transición con actor/motivo/fecha; snapshot de descripción/opciones y calidad del costo; asignación de descuentos y comisiones. Revisar primero lo que ya existe. Agregar migraciones versionadas, compatibles y con reversión documentada. No usar sincronización destructiva en producción.

Contratos propuestos, a conciliar con rutas existentes: listado autenticado acotado de pedidos activos con negocio/contexto, actualización condicional por versión y snapshot de cambios; creación idempotente en POS y público; resumen de margen con cobertura y base de cálculo. No crear stream público con datos personales. Para reconexión preferir snapshot completo acotado antes que un cursor que pueda perder cancelaciones.

Transacciones: pedido, líneas y efectos de inventario/pago deben ser consistentes; publicar/mostrar solo después de commit. Opciones y notas históricas no deben depender exclusivamente del catálogo mutable. Evitar sumar ingresos uniendo directamente pagos y líneas: puede multiplicar montos por cardinalidad.

## 6. Condición de salida

Entrega A lista solo con RF-01 a RF-07 y RF-09 aprobados, hardware real comprobado y flujo tributario externo operativo. Entrega B exige RF-08. No publicar promesas comerciales superiores a lo demostrado. La decisión de escalar requiere los resultados de [VALIDACION.md](VALIDACION.md).
