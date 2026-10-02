# Operfoods: preparación para pilotos pagados

Fecha: 2026-10-02. Estado: planificación lista; implementación y visitas no iniciadas.

Ubicación versionada: repositorio `waldo-dev/fast-trucks-front`, carpeta `docs/operfoods/`. Las rutas `app-frontend/` y `app-backend/` de estos documentos se refieren al workspace original `operfoods/`: este repositorio es `app-frontend/` y el backend se encuentra en `waldo-dev/fast-truck-back`. El Graphify adjunto es una instantánea del workspace original completo; también contiene casinos y no está limitado a este repositorio. Para reextraer ese mismo corpus, ejecutar Graphify desde el workspace que reúne ambos proyectos. Los documentos de esta carpeta son la versión de referencia para futuros cambios.

## Decisión

Probar Operfoods en locales pequeños de comida rápida de mostrador con pedidos simultáneos, retiro y al menos dos personas durante el servicio. Validar el pago y la continuidad antes de ampliar el producto. Food trucks son una segunda hipótesis, no el foco inicial.

Promesa inicial: «Ordena los pedidos de mostrador y del menú online en una sola cola, coordina la cocina y cierra tu caja con claridad». La promesa de márgenes se incorpora cuando los costos sean confiables. El enlace del menú se puede compartir por WhatsApp; no prometer captura automática de conversaciones.

## Documentos para retomar

1. [Spec funcional y técnico](SPEC.md): alcance, requisitos, aceptación y decisiones.
2. [Plan de ejecución](PLAN.md): fases, tareas, dependencias y condiciones para avanzar.
3. [Validación comercial](VALIDACION.md): entrevistas, oferta, medición y decisión.
4. [Mapa del proyecto y Graphify](GRAPHIFY.md): módulos, evidencias y consultas.
5. [Grafo interactivo existente](../../graphify-out/graph.html) y [reporte de extracción](../../graphify-out/GRAPH_REPORT.md).

## Alcance del repositorio

El producto evaluado vive en `app-frontend/` y `app-backend/`. `casinos-back/`, `casinos-app/` y el Docker Compose de la raíz pertenecen al sistema de casinos; no forman parte de esta iniciativa. El README raíz describe ese otro sistema. No usar su comando de arranque como receta de despliegue de Operfoods.

## Primer paso al volver

Leer estos documentos y contrastar su diagnóstico con el código vigente. Ejecutar la fase 0 del plan en una base de prueba. Las observaciones actuales vienen de lectura estática y del Graphify del 2026-10-01: no se ha comprobado ejecución, despliegue, integraciones ni compatibilidad con impresoras. Ninguna tarea del plan está completada por la creación de estos documentos.

No se ha fijado precio definitivo, proveedor tributario, impresora ni fecha de lanzamiento. Esas decisiones tienen tareas explícitas y no impiden empezar la validación comercial.
