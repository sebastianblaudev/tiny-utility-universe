-- Insert Simple DTE plugin definition
INSERT INTO public.plugin_definitions (
  id,
  plugin_key,
  name,
  description,
  version,
  price_monthly,
  features,
  is_active
) VALUES (
  gen_random_uuid(),
  'simple_dte_chile',
  'Simple DTE Chile',
  'Integración con SimpleAPI para generar DTEs y enviar facturas electrónicas al SII Chile',
  '1.0.0',
  29990,
  '[
    "Generación automática de DTEs (Documentos Tributarios Electrónicos)",
    "Integración directa con SimpleAPI",
    "Subida segura de certificados PFX",
    "Configuración de archivos CAF",
    "Envío automático de facturas al SII",
    "Soporte para facturas y boletas electrónicas",
    "Manejo de folios automático",
    "Respaldo y trazabilidad de documentos"
  ]'::jsonb,
  true
) ON CONFLICT (plugin_key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active;