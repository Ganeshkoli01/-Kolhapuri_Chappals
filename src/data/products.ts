export type Category = 'Men' | 'Women' | 'Kids';

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  category: Category;
  sizes: number[];
  stock_quantity: number;
  images: string[];
  is_trending: boolean;
  created_at?: string;
  cod_available?: boolean;
  tax_amount?: number;
  shipping_charge?: number;
  other_charges?: number;
}

// We no longer export the hardcoded products list.
// Products should be fetched from Supabase using:
// supabase.from('products').select('*')
export const products: Product[] = [];
