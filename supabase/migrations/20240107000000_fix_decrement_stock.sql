-- Make decrement_stock SECURITY DEFINER so regular users can decrement stock during checkout without RLS preventing the UPDATE.
CREATE OR REPLACE FUNCTION decrement_stock(p_id UUID, p_qty INT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.products
  SET stock_quantity = GREATEST(stock_quantity - p_qty, 0)
  WHERE id = p_id;
END;
$$;
