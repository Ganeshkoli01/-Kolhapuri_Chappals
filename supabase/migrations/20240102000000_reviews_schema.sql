-- Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id TEXT NOT NULL, -- Using TEXT temporarily to support mock data IDs like '1', '2'
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(product_id, user_id) -- One review per product per user
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Policies for reviews
CREATE POLICY "Anyone can view reviews" 
    ON public.reviews FOR SELECT 
    USING (true);

CREATE POLICY "Authenticated users can insert reviews" 
    ON public.reviews FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews" 
    ON public.reviews FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews" 
    ON public.reviews FOR DELETE 
    USING (auth.uid() = user_id);

-- Create a function to check if a user has ordered a product
-- Note: Because products in the mock data use '1' instead of UUID, 
-- this function checks the text representation. 
CREATE OR REPLACE FUNCTION public.has_user_ordered_product(p_user_id UUID, p_product_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    has_ordered BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM public.orders o
        JOIN public.order_items oi ON o.id = oi.order_id
        WHERE o.user_id = p_user_id 
        AND oi.product_id::TEXT = p_product_id
    ) INTO has_ordered;
    
    RETURN has_ordered;
END;
$$;
