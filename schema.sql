-- botcom — Esquema de tablas del agente de ventas WhatsApp
-- Crea las tablas propias del bot y el rol de acceso de permisos mínimos.
-- Las tablas de catálogo (products, product_images, inventory) se asumen existentes.

-- Pedidos tomados por el bot
CREATE TABLE IF NOT EXISTS public.orders (
  id               bigserial PRIMARY KEY,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  status           text NOT NULL DEFAULT 'nuevo'
                     CHECK (status IN ('nuevo','confirmado','en_proceso','enviado','entregado','cancelado')),
  channel          text NOT NULL DEFAULT 'whatsapp',
  customer_name    text,
  customer_phone   text NOT NULL,
  customer_email   text,
  customer_city    text,
  customer_department text,
  customer_neighborhood text,
  customer_address text,
  address_notes    text,
  payment_method   text CHECK (payment_method IN ('transferencia','nequi','daviplata','contraentrega')),
  items            jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_cop        numeric(12,2),
  notes            text,
  kapso_conversation_id text,
  source_wa_id     text
);
CREATE INDEX IF NOT EXISTS idx_orders_phone   ON public.orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_status  ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at DESC);

-- Parámetros configurables (editables en NocoDB): cuentas de pago, promos, etc.
CREATE TABLE IF NOT EXISTS public.bot_config (
  id bigserial PRIMARY KEY,
  clave text UNIQUE NOT NULL,
  valor text,
  descripcion text,
  activo boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Estado del bot por número (botón on/off = bot_activo). El relay lo consulta.
CREATE TABLE IF NOT EXISTS public.bot_estado (
  id bigserial PRIMARY KEY,
  telefono text UNIQUE NOT NULL,          -- solo dígitos
  bot_activo boolean NOT NULL DEFAULT true,
  nombre text,
  ultima_interaccion timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  notas text
);

-- Preguntas frecuentes
CREATE TABLE IF NOT EXISTS public.bot_faqs (
  id bigserial PRIMARY KEY,
  pregunta text, respuesta text, palabras_clave text,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Log de eventos (pedidos, handoff)
CREATE TABLE IF NOT EXISTS public.bot_logs (
  id bigserial PRIMARY KEY,
  evento text, telefono text, detalle jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Rol de permisos mínimos para el bot (cambia la contraseña).
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='bot_ventas') THEN
    CREATE ROLE bot_ventas LOGIN PASSWORD 'CAMBIA_ESTA_CONTRASENA';
  END IF;
END $$;
GRANT CONNECT ON DATABASE postgres TO bot_ventas;
GRANT USAGE ON SCHEMA public TO bot_ventas;
GRANT SELECT ON public.products, public.inventory, public.product_images TO bot_ventas;
GRANT SELECT ON public.bot_config, public.bot_faqs TO bot_ventas;
GRANT SELECT, INSERT, UPDATE ON public.orders     TO bot_ventas;
GRANT SELECT, INSERT, UPDATE ON public.bot_estado TO bot_ventas;
GRANT SELECT, INSERT ON public.bot_logs           TO bot_ventas;
GRANT USAGE, SELECT ON SEQUENCE public.orders_id_seq, public.bot_estado_id_seq, public.bot_logs_id_seq TO bot_ventas;

-- Semillas de ejemplo (opcional)
INSERT INTO public.bot_config (clave, valor, descripcion) VALUES
  ('titular_cuenta','','Titular de las cuentas de pago'),
  ('cuenta_nequi','','Numero Nequi'),
  ('cuenta_daviplata','','Numero Daviplata'),
  ('cuenta_bancolombia','','Cuenta Bancolombia'),
  ('link_pago','','Link de pago si aplica'),
  ('instrucciones_pago','Envia el comprobante por este chat despues de pagar.','Texto de pago'),
  ('costo_envio','','Politica de envio'),
  ('horario_atencion','Lun a Sab 8am-6pm','Horario'),
  ('promo_activa','false','Interruptor de promocion'),
  ('promo_template','','Nombre de plantilla aprobada en Meta'),
  ('promo_idioma','es','Idioma de la plantilla'),
  ('promo_descripcion','','Descripcion de la promo')
ON CONFLICT (clave) DO NOTHING;
