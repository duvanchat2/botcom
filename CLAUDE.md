# botcom — Agente de ventas por WhatsApp (Hermes + Kapso + OpenRouter)

Framework/columna vertebral para montar agentes de ventas por WhatsApp con IA.
Implementación de referencia: **Natural Smith SAS** (suplementos, Colombia) — agente "Sofía".

> ⚠️ Este repo NO contiene secretos. Las credenciales viven en `/root/.hermes/.env`
> del servidor y se documentan en `.env.example`. Nunca subir `.env`, tokens ni contraseñas.

## Arquitectura

```
Cliente WhatsApp
   │  (WhatsApp Business Cloud API - Meta)
Kapso  (conector oficial + inbox humano)
   │  webhook v2  ->  https://<host>/kapso/webhook
Nginx (HTTPS)  ->  relay (127.0.0.1:8649)  ->  Hermes Gateway (127.0.0.1:8648)
   │                     └─ gate de pausa on/off por número (tabla bot_estado)
Hermes Agent (persona + herramientas)
   ├─ Cerebro: OpenRouter (modelo, p.ej. anthropic/claude-haiku-4.5)
   └─ Herramientas (scripts Node): consultan Postgres / envían por Kapso / Telegram
Postgres (Supabase)  ·  catálogo, config, pedidos, estado, FAQs, logs
```

- **Cerebro** = OpenRouter (la IA NO corre en el servidor; se paga por uso).
- **Conector WhatsApp** = Kapso (plugin oficial `gokapso/hermes-agent-plugin`).
- **Agente** = Hermes Agent (nousresearch), servicio systemd `hermes-gateway`.
- **Relay** = micro-servicio Node (systemd `ns-bot-relay`) que pausa el bot por número.

## Estructura del repo

```
scripts/                 Herramientas del agente (Node, usan pg + fetch)
  buscar_producto.js     Búsqueda full-text en catálogo (nombre+categoria+tipo)
  enviar_foto.js         Envía foto del producto (product_images) por Kapso
  crear_orden.js         Registra pedido en `orders` + avisa por Telegram + log
  obtener_config.js      Lee parámetros configurables (bot_config)
  buscar_faq.js          Preguntas frecuentes (bot_faqs)
  notificar_telegram.js  Envía mensaje al grupo de Telegram
  notificar_mario.js     Handoff: pausa el número + avisa por Telegram + log
  enviar_plantilla.js    Envía plantilla de WhatsApp (promos) con interruptor
  relay.js               Gate de pausa (Nginx -> relay -> Hermes)
schema.sql               DDL de las tablas del bot (orders, bot_config, etc.)
SOUL.md                  Persona/reglas del agente (plantilla personalizable)
SKILL.md                 Instrucciones de la skill de ventas
.env.example             Plantilla de variables de entorno (SIN secretos)
```

## Tablas (ver `schema.sql`)

| Tabla | Para qué |
|---|---|
| `products` / `product_images` / `inventory` | Catálogo, imágenes y stock (existentes) |
| `orders` | Pedidos tomados por el bot |
| `bot_config` | Parámetros editables (cuentas de pago, promos, horario) |
| `bot_estado` | Registro de números + botón `bot_activo` (pausa on/off) |
| `bot_faqs` | Preguntas frecuentes |
| `bot_logs` | Log de eventos (pedidos, handoff) |

## Cómo montar un agente nuevo (resumen)

1. Instalar Hermes Agent en el servidor y el plugin de Kapso.
2. Configurar cerebro (OpenRouter) y credenciales en `.env` (ver `.env.example`).
3. Correr `schema.sql` para crear las tablas.
4. Personalizar `SOUL.md` (negocio, tono, guion de ventas, cierre, handoff) y `SKILL.md`.
5. Cargar catálogo del cliente + `bot_config` (pagos) + `bot_faqs`.
6. Conectar el número de WhatsApp en Kapso y crear el webhook al relay.
7. Levantar `hermes-gateway` y `ns-bot-relay` (systemd).

## Convenciones / notas

- Los scripts cargan `.env` desde `/root/.hermes/.env` (loader incondicional al inicio de cada script).
- Teléfonos se normalizan a solo dígitos para casear el estado de pausa.
- Notificaciones internas al cliente desactivadas (`background_process_notifications: none`).
- Telegram es SOLO para avisos (variables `NS_TG_TOKEN` / `NS_TG_CHAT`); NO usar `TELEGRAM_BOT_TOKEN`
  (Hermes levantaría un gateway de Telegram que hace polling y falla).
- El payload real de Kapso trae el número del cliente en `message.from`.

## Seguridad

- No commitear `.env`, `node_modules/`, backups (`*.bak*`), ni claves.
- Precios/stock/datos SIEMPRE desde la base de datos; el agente nunca los inventa.
