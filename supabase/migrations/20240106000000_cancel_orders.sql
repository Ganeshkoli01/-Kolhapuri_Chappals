-- Add UPDATE policy so users can update their own orders
CREATE POLICY "Users can update own orders" 
    ON public.orders FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Drop the old constraint
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;

-- Add the new constraint with 'cancelled'
ALTER TABLE public.orders ADD CONSTRAINT orders_payment_status_check CHECK (payment_status IN ('pending', 'paid', 'failed', 'cancelled'));

-- RPC to increment stock when an order is cancelled
CREATE OR REPLACE FUNCTION increment_stock(p_id UUID, p_qty INT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.products
  SET stock_quantity = stock_quantity + p_qty
  WHERE id = p_id;
END;
$$;
