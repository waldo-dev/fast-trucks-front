# Plan de ejecución y puntos de decisión

Fecha: 2026-10-02. Todas las tareas pendientes. No comenzar implementación por la existencia de este documento.

## Orden y presupuesto de esfuerzo

Estimaciones orientativas para una persona familiarizada con el proyecto; recalibrar después de fase 0. No prometen entrega en 2–3 semanas. Entrevistas y preparación comercial pueden avanzar sin desarrollo; piloto y retención requieren semanas calendario adicionales.

| Fase | Esfuerzo estimado | Dependencia | Resultado para avanzar |
|---|---|---|---|
| 0. Línea base técnica | 1–2 días | Retomar proyecto | Flujo ejecutado y riesgos priorizados |
| 1. Descubrimiento comercial | 2–4 días repartidos | Ninguna implementación | 10 entrevistas y 3 candidatos con precio acordado |
| 2. Integridad y aislamiento | 2–5 días | Fase 0 | No hay bloqueos de datos/pedidos/caja |
| 3. Cola, cocina y alertas | 3–5 días | Fase 2; necesidad confirmada | Flujo simultáneo fiable |
| 4. Impresión, móvil, demo | 2–4 días | Hardware elegido; fase 3 | Operación verificable en local |
| 5. Pilotos entrega A | 2 semanas calendario + soporte | Fases 1–4 | Uso y beneficio medidos |
| 6. Márgenes entrega B | 3–6 días | Costos reales y uso estable | Reporte conciliado y comprensible |
| 7. Retención y decisión | Segundo mes de uso | Pilotos y cobro | Decisión documentada |

Fases 0 y 2–4 suman aproximadamente 8–16 días de trabajo técnico, sin integración automática de impresora ni proveedor tributario. Revisar el presupuesto si esos componentes son indispensables. Interrumpir expansión si no se consiguen pilotos comprometidos; no seguir completando un backlog por inercia.

## Fase 0 — verificar antes de diseñar más

- [ ] T00 Confirmar estado del checkout y cambios del usuario; leer README propios, env de ejemplo y Graphify. No usar stack de casinos.
- [ ] T01 Preparar base de prueba y arranque reproducible de backend/frontend; documentar comandos exactos y versiones. No reutilizar datos reales para demo.
- [ ] T02 Ejecutar menú → pedido → cocina/estado → cobro → cierre, con opciones y sin evento. Registrar fallos y capacidades comprobadas.
- [ ] T03 Revisar rutas públicas, alcance por negocio, eventos/gastos, permisos y acceso a datos de clientes. Comprobar con dos negocios.
- [ ] T04 Revisar costos por línea, descuentos, consumo de inventario, cancelaciones y migraciones disponibles.
- [ ] T05 Ejecutar build/lint de cada app según scripts actuales. Registrar deuda previa separada de nuevas regresiones; hoy no existe script de tests en sus package.json revisados.

Salida: checklist de línea base, lista de bloqueos P0 y estimación revisada. No tocar producción.

## Fase 1 — comprobar intención de compra

- [ ] T10 Seleccionar 10 locales comparables y hacer entrevistas de [VALIDACION.md](VALIDACION.md).
- [ ] T11 Observar al menos 3 servicios; medir toma de pedido y cierre actuales.
- [ ] T12 Acordar con 3 candidatos precio, duración, dispositivo, hardware y flujo tributario. Registrar objeciones y rechazo.
- [ ] T13 Elegir impresora/dispositivo que se pueda probar; decidir impresión manual o automática según operación real.

Salida: tres pilotos con condiciones explícitas. Si no hay compromiso, revisar oferta/segmento antes de fase 3.

## Fase 2 — conservar datos correctos

- [ ] T20 Resolver y probar autenticación/aislamiento en pedidos, eventos, gastos y caja (RF-09).
- [ ] T21 Implementar idempotencia transaccional de creación en ambos canales y reintento seguro (RF-01).
- [ ] T22 Validar estados, concurrencia e historial; conservar notas y opciones históricas (RF-02).
- [ ] T23 Conciliar cobros/caja y efectos de cancelación, devolución e inventario (RF-06).
- [ ] T24 Crear migraciones y probar aplicación/restauración en base de prueba.

Salida: casos de dos negocios, doble envío y cancelaciones pasan. No pilotear con un bloqueo de aislamiento o duplicación conocido.

## Fase 3 — operar la hora punta

- [ ] T30 Unificar cola activa y vista de cocina reutilizando módulo de pedidos.
- [ ] T31 Agregar sondeo acotado, snapshot al reconectar/cambiar contexto y protección de respuestas atrasadas.
- [ ] T32 Agregar alerta visual/audio habilitado por usuario, deduplicación y estado de conexión.
- [ ] T33 Mostrar antigüedad, opciones/notas y código de retiro, con permisos mínimos.
- [ ] T34 Verificar RF-03 y carga RF-09 en dos pantallas reales.

Salida: pedido online visible sin recarga, cocinero puede prepararlo y cajero entregarlo sin estados inconsistentes.

## Fase 4 — preparar uso y demostración

- [ ] T40 Crear formatos de comanda/ticket y reimpresión; probar en hardware elegido (RF-04).
- [ ] T41 Ajustar POS y menú al celular/tablet del piloto (RF-05).
- [ ] T42 Crear seed/reset seguro de demo, menú ejemplo y recorrido de tres minutos (RF-07).
- [ ] T43 Revisar navegación: ocultar páginas sin función útil para el piloto y comprobar permisos en servidor.
- [ ] T44 Preparar instalación, QR, capacitación, respaldo/restauración, soporte y contingencia.
- [ ] T45 Ejecutar aceptación completa de entrega A; builds/lint pertinentes y pruebas de regresión.

Salida: checklist firmado internamente con evidencia, limitaciones y precio; no prometer automatizaciones no verificadas.

## Fases 5–7 — aprender, costear y decidir

- [ ] T50 Instalar tres pilotos y medir tiempo de configuración; cargar carta aprobada.
- [ ] T51 Registrar uso, errores, soporte y cierre durante dos semanas; comparar con línea base.
- [ ] T52 Cobrar según acuerdo y registrar ingreso real, fecha e impuestos definidos.
- [ ] T60 Completar recetas/envases/costos de productos representativos de pilotos.
- [ ] T61 Normalizar significado de costos y base tributaria; snapshots y descuentos; corregir margen de eventos (RF-08).
- [ ] T62 Crear reporte diario/producto con cobertura; probar cantidades, extras, faltantes, devoluciones y cambio de costos.
- [ ] T63 Revisar el reporte con dueños y documentar qué decisión les permitió tomar.
- [ ] T70 Verificar segundo mes pagado, uso y costo de atención; emitir decisión continuar/ajustar/detener.

## Verificación mínima futura

| Caso | Evidencia |
|---|---|
| Dos negocios y usuario anónimo | Acceso privado y mutaciones cruzadas rechazados |
| Doble envío / respuesta perdida | Un pedido y efectos únicos |
| Dos operadores | Conflicto detectado, estado final coherente |
| Opciones y notas | Captura, pantalla y comanda idénticas |
| Caída de red / reconexión | Error visible, pendientes recuperados sin duplicar |
| Caja con efectivo/tarjeta/transferencia/anulación | Conciliación manual con movimientos reales |
| Impresión y reimpresión | Hardware probado, copia identificada |
| Costos, descuento y cantidad 2 | Reporte manualmente conciliado, sin doble multiplicación |
| Cambio de precio/costo | Histórico preservado |
| Respaldo y migraciones | Restauración en base de prueba |

Automatizar pruebas de dominio/API de integridad y aislamiento, y pocos E2E de flujos críticos. Impresión/audio/dispositivos requieren evidencia manual adicional. No cambiar las apps de casinos para hacer pasar checks de Operfoods.

## Instrucción lista para retomar

«Lee docs/operfoods/README.md, SPEC.md, PLAN.md, VALIDACION.md y GRAPHIFY.md. Retoma desde fase 0, comprueba el código vigente y documenta la línea base. Implementa únicamente las tareas de Operfoods habilitadas por sus dependencias, sin modificar casinos. No des por realizada ninguna tarea por figurar en el spec. Mantén registro de aceptación y comunica los bloqueos comerciales que requieren datos de los locales».
