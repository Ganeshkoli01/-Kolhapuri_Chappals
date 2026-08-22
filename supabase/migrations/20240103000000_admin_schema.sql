-- Add role column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
    RETURN COALESCE(user_role = 'admin', false);
END;
$$;

-- Products Admin Policies
CREATE POLICY "Admins can insert products" 
    ON public.products FOR INSERT 
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update products" 
    ON public.products FOR UPDATE 
    USING (public.is_admin());

CREATE POLICY "Admins can delete products" 
    ON public.products FOR DELETE 
    USING (public.is_admin());

-- Profiles Admin Policies
CREATE POLICY "Admins can view all profiles" 
    ON public.profiles FOR SELECT 
    USING (public.is_admin());

-- Orders Admin Policies
CREATE POLICY "Admins can view all orders" 
    ON public.orders FOR SELECT 
    USING (public.is_admin());
    
CREATE POLICY "Admins can update orders" 
    ON public.orders FOR UPDATE 
    USING (public.is_admin());

-- Order Items Admin Policies
CREATE POLICY "Admins can view all order items" 
    ON public.order_items FOR SELECT 
    USING (public.is_admin());
