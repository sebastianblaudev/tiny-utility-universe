-- Add foreign key constraint between pedido_mesa_items and products
ALTER TABLE public.pedido_mesa_items 
ADD CONSTRAINT fk_pedido_mesa_items_product 
FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

-- Add foreign key constraint between pedido_mesa_items and pedidos_mesa
ALTER TABLE public.pedido_mesa_items 
ADD CONSTRAINT fk_pedido_mesa_items_pedido 
FOREIGN KEY (pedido_mesa_id) REFERENCES public.pedidos_mesa(id) ON DELETE CASCADE;

-- Add foreign key constraint between pedidos_mesa and mesas
ALTER TABLE public.pedidos_mesa 
ADD CONSTRAINT fk_pedidos_mesa_mesa 
FOREIGN KEY (mesa_id) REFERENCES public.mesas(id) ON DELETE CASCADE;