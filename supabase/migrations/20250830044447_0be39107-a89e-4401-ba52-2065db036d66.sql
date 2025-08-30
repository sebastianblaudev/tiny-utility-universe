-- Remove the specified plugins from plugin_definitions
DELETE FROM plugin_definitions 
WHERE plugin_key IN ('simple_dte_chile', 'mercado_pago_pos');

-- Clean up any related plugin configurations
DELETE FROM plugin_configurations 
WHERE plugin_key IN ('simple_dte_chile', 'mercado_pago_pos');

-- Clean up any related tenant plugins
DELETE FROM tenant_plugins 
WHERE plugin_key IN ('simple_dte_chile', 'mercado_pago_pos');