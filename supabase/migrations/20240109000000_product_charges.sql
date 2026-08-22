-- Add Cash on Delivery toggle and extra charges to products
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS cod_available BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS shipping_charge DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS other_charges DECIMAL(10,2) DEFAULT 0;
