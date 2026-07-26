# Agente de Ventas por WhatsApp "Sofía" — Natural Smith SAS
### Documento de entrega y hoja de ruta

**Cliente:** Natural Smith SAS
**Producto:** Asistente de ventas por WhatsApp con Inteligencia Artificial
**Número de atención:** +57 316 9723962
**Estado:** En producción ✅

---

## 1. ¿Qué es?

Un **asesor de ventas virtual** llamado **Sofía** que atiende a tus clientes por WhatsApp de forma automática, las 24 horas. Responde preguntas de productos con información **real de tu base de datos** (nunca inventa precios ni existencias), envía fotos, toma pedidos completos y, cuando hace falta, le pasa la conversación a una persona del equipo.

**Beneficios clave:**
- Atención inmediata 24/7, sin hacer esperar al cliente.
- Respuestas siempre con datos reales (precio, presentación, disponibilidad).
- Menos carga operativa: el bot filtra y avanza las ventas; el humano solo entra cuando se necesita.
- Todo queda registrado (pedidos y conversaciones) para trazabilidad.

---

## 2. Alcance entregado (incluido en esta fase)

| # | Funcionalidad | Descripción |
|---|---|---|
| 1 | **Atención automática 24/7** | Persona de marca "Sofía": saludo cordial (buenos días/tardes/noches), pide el nombre y guía la venta. |
| 2 | **Búsqueda en catálogo real** | Consulta la base de datos (1.273 productos): nombre, presentación, **precio en COP** y disponibilidad. |
| 3 | **Envío de fotos del producto** | Cuando el cliente pide una imagen, el bot la envía desde el catálogo. |
| 4 | **Guion de ventas con cierre** | Descubre la necesidad, recomienda, maneja objeciones (sin bajar precio) y **cierra el pedido**. |
| 5 | **Toma de pedido completa** | Captura nombre, celular (10 díg), correo, ciudad, departamento, barrio, dirección + detalles (conjunto/torre/apto) y método de pago. Queda registrado en la base de datos. |
| 6 | **Datos de pago configurables** | Cuentas (Nequi, Daviplata, Bancolombia), link de pago e instrucciones editables **sin programar**. El bot solo entrega lo que esté configurado. |
| 7 | **Transferencia a humano (handoff)** | Ante reclamos, dudas médicas, negociaciones o petición de "hablar con una persona", el bot **avisa al encargado** y le cede la conversación. |
| 8 | **Interruptor bot ON/OFF por cliente** | Cada número tiene un botón. Si un asesor quiere responder manualmente desde el panel, apaga el bot para ese cliente; el agente deja de responder hasta reactivarlo. |
| 9 | **Alcance controlado** | Solo habla de productos y del proceso de compra. Temas ajenos (deportes, política, etc.) los redirige con amabilidad a la venta. |
| 10 | **Plantillas de promoción con interruptor** | Mecanismo listo para enviar promociones aprobadas por Meta, con encendido/apagado. *(Requiere plantilla aprobada — ver Roadmap.)* |

---

## 3. ¿Cómo se opera? (sin conocimientos técnicos)

- **Panel de conversaciones (Kapso Inbox):** el equipo ve todos los chats y puede tomar cualquiera manualmente.
- **Panel de datos (NocoDB):** para editar, sin programar:
  - Datos de pago (cuentas, links).
  - Encender/apagar el bot por cliente.
  - Activar/desactivar promociones.

---

## 4. Arquitectura (visión general)

```
   Cliente en WhatsApp
          │
          ▼
   Kapso  (conexión oficial con WhatsApp + panel de atención humana)
          │
          ▼
   Agente Sofía (IA)  ──►  Base de datos Natural Smith
                              (catálogo, precios, stock, pedidos)
```

La IA responde en segundos; los datos siempre salen de la base de Natural Smith. Todo corre en el servidor propio de la empresa.

---

## 5. Roadmap — Funcionalidades NO incluidas (fase 2 y siguientes)

> Estas funciones **no forman parte del alcance actual**, pero la base ya está construida para incorporarlas.

### 5.1 Campañas y envíos masivos con plantillas *(solicitado)*

Envío proactivo a bases de datos de clientes (MercadoLibre, Shopify, etc.) usando plantillas de WhatsApp aprobadas. Casos:

- **Recompra por consumo (recordatorio inteligente):**
  El cliente compró un producto que dura ~20 días. Unos días antes de que se le acabe, el sistema le envía automáticamente una plantilla con un **descuento de recompra**.
  *Ejemplo:* compró Omega 3 en ML → a los ~17 días recibe: *"Se te está por acabar tu Omega 3, vuelve a pedirlo con 10% OFF 👉 [tienda]"*.

- **Reactivación de clientes inactivos:**
  Cliente de la base de ML/Shopify que compró una sola vez y no volvió → recibe una plantilla de reactivación con incentivo.

- **Respuesta a la campaña — manual o automática:**
  Cuando el cliente responde a la plantilla, la conversación puede seguir **manual** (un asesor en el panel) o **automática** (Sofía retoma, cotiza y cierra el pedido).

**Requisitos para activarlo:**
- Integración con las bases de datos de clientes (ML/Shopify) y su historial de compra.
- Segmentación (qué producto, cada cuánto se consume, última compra).
- Plantillas aprobadas por Meta y **consentimiento (opt-in)** de los clientes.

### 5.2 Funciones sugeridas para **aumentar/mejorar ventas**

| Función | Qué aporta a las ventas |
|---|---|
| **Seguimiento de cotización sin cierre** | Si alguien preguntó y no compró, un recordatorio a las X horas recupera ventas perdidas. |
| **Upsell y cross-sell automático** | Sofía recomienda complementarios ("quien lleva colágeno también lleva vitamina C") → sube el ticket promedio. |
| **Cupones / códigos de descuento personalizados** | Incentivos medibles por cliente/campaña. |
| **Programa de referidos por WhatsApp** | Cada cliente puede traer nuevos clientes con un código. |
| **Post-venta y reseñas** | Mensaje tras la entrega pidiendo reseña/testimonio → prueba social y fidelización. |
| **Pagos integrados con confirmación automática** | Link de pago (Wompi/Mercado Pago) + el bot detecta el pago y confirma el pedido solo. |
| **Mensajes interactivos (botones y listas)** | Catálogos y opciones con botones → compra más rápida y menos fricción. |
| **Dashboard de resultados del bot** | Conversaciones, pedidos, tasa de conversión, productos más pedidos, ingresos generados. |
| **Segmentación / CRM (etiquetas)** | Clasificar clientes (nuevo, recurrente, VIP, inactivo) para campañas dirigidas. |
| **Notas de voz** | El cliente manda un audio y el bot lo entiende y responde. |
| **Búsqueda por imagen** | El cliente envía una foto de un producto y el bot lo identifica en el catálogo. |
| **Estado del pedido / logística** | El cliente consulta "¿dónde va mi pedido?" y recibe el estado/guía de envío. |
| **A/B testing de mensajes y promos** | Probar variantes para descubrir qué vende más. |

---

## 6. Consideraciones para la fase 2

- **Reglas de WhatsApp (Meta):** los envíos proactivos y fuera de la ventana de 24 horas requieren **plantillas aprobadas** y **opt-in** del cliente. El uso indebido puede penalizar el número.
- **Protección de datos (Colombia – Ley 1581 / Habeas Data):** las campañas a bases de datos requieren consentimiento y manejo responsable de datos personales.
- **Costos operativos a considerar:** conversaciones de WhatsApp (tarifa Meta), uso de IA y mantenimiento de la infraestructura.

---

## 7. Estado actual y próximos pasos

**Listo y funcionando:** todo el alcance de la sección 2, en el número de producción **+57 316 9723962**.

**Para dejarlo al 100% de operación comercial:**
1. Cargar los **datos de pago** (cuentas/links) en el panel.
2. (Opcional) Aprobar una **plantilla de promoción** en Meta y activarla.
3. Verificar el flujo completo con pruebas reales.

**Fase 2 (a cotizar/planear):** campañas de recompra y reactivación (sección 5.1) y las funciones de crecimiento (sección 5.2).

---

*Documento preparado para Natural Smith SAS. Las funciones de la sección 5 son propuestas de evolución y no forman parte del alcance entregado.*
