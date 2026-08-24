-- Drop the existing constraint if it exists (assuming default naming)
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;

-- Add the new constraint allowing PhonePe
ALTER TABLE public.orders ADD CONSTRAINT orders_payment_method_check 
  CHECK (payment_method IN ('Razorpay', 'COD', 'PhonePe'));

-- Add phonepe_transaction_id column
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS phonepe_transaction_id TEXT;
