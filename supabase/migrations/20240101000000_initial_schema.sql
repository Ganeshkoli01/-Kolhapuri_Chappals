-- Enable pgcrypto for UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category TEXT CHECK (category IN ('Men', 'Women', 'Kids')),
    sizes INTEGER[] DEFAULT '{}',
    stock_quantity INTEGER DEFAULT 0,
    images TEXT[] DEFAULT '{}',
    is_trending BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create cart_items table
CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    size INTEGER NOT NULL,
    quantity INTEGER DEFAULT 1 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, product_id, size)
);

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
    payment_method TEXT CHECK (payment_method IN ('Razorpay', 'COD')),
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    shipping_address JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    size INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL
);

-- Enable Row-Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view own profile" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

-- Policies for products (Public read)
CREATE POLICY "Anyone can view products" 
    ON public.products FOR SELECT 
    USING (true);

-- Policies for cart_items
CREATE POLICY "Users can manage own cart" 
    ON public.cart_items FOR ALL 
    USING (auth.uid() = user_id);

-- Policies for orders
CREATE POLICY "Users can view own orders" 
    ON public.orders FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders" 
    ON public.orders FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Policies for order_items
CREATE POLICY "Users can view own order items" 
    ON public.order_items FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM public.orders 
        WHERE orders.id = order_items.order_id 
        AND orders.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert own order items" 
    ON public.order_items FOR INSERT 
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.orders 
        WHERE orders.id = order_items.order_id 
        AND orders.user_id = auth.uid()
    ));

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Insert Mock Data for Products
INSERT INTO public.products (name, slug, description, price, category, sizes, stock_quantity, images, is_trending) VALUES
('Kapshi Kolhapuri Chappal', 'kapshi-kolhapuri', 'Traditional Kapshi style with a comfortable fit.', 1499, 'Men', '{7,8,9,10,11}', 25, '{"/img/image_1099091e.png"}', true),
('Maroon Punjabi Kolhapuri', 'maroon-punjabi-kolhapuri', 'Deep maroon finish with a stylish Punjabi toe loop.', 1799, 'Women', '{4,5,6,7,8}', 15, '{"/img/image_3249aa71.png"}', true),
('Mustard Braided Kolhapuri', 'mustard-braided', 'Bright mustard leather with intricate braids.', 1299, 'Women', '{5,6,7,8}', 10, '{"/img/image_1d0e1a20.png"}', false),
('Pukari Heavy-Duty Kolhapuri', 'pukari-heavy-duty', 'Durable, heavy-duty soles built for rough terrain.', 1999, 'Men', '{8,9,10,11,12}', 30, '{"/img/image_8ef9a126.png"}', true);

-- RPC for stock decrement
CREATE OR REPLACE FUNCTION decrement_stock(p_id UUID, p_qty INT)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.products
  SET stock_quantity = GREATEST(stock_quantity - p_qty, 0)
  WHERE id = p_id;
END;
$$;
