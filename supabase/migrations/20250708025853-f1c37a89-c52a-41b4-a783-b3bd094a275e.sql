-- Fix missing tenant_id in sale_items by copying from their parent sales
UPDATE sale_items 
SET tenant_id = sales.tenant_id 
FROM sales 
WHERE sale_items.sale_id = sales.id 
AND sale_items.tenant_id IS NULL;