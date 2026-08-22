import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Product } from '../data/products';
import toast from 'react-hot-toast';

interface WishlistContextType {
  wishlistItems: Product[];
  toggleLike: (product: Product) => void;
  isLiked: (productId: string) => boolean;
  isWishlistOpen: boolean;
  setIsWishlistOpen: (isOpen: boolean) => void;
  removeFromWishlist: (productId: string) => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState<Product[]>(() => {
    try {
      const local = localStorage.getItem('pt_wishlist');
      return local ? JSON.parse(local) : [];
    } catch {
      return [];
    }
  });
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Sync to localStorage whenever wishlistItems changes
  useEffect(() => {
    localStorage.setItem('pt_wishlist', JSON.stringify(wishlistItems));
  }, [wishlistItems]);

  useEffect(() => {
    const fetchWishlist = async (uid: string) => {
      const { data, error } = await supabase
        .from('wishlists')
        .select(`product_id, products (*)`)
        .eq('user_id', uid);
        
      if (!error && data) {
        // Map joined data back to products
        const dbItems = data.map(item => item.products).filter(Boolean) as Product[];
        
        // Merge local and db items (prefer db items for simplicity)
        // If there were local items, we could save them to DB here, but for now we'll just merge locally
        setWishlistItems(prev => {
          const merged = [...dbItems];
          prev.forEach(p => {
            if (!merged.find(m => m.id === p.id)) {
              merged.push(p);
              // Optimistically save local to DB
              supabase.from('wishlists').insert({ user_id: uid, product_id: p.id }).then();
            }
          });
          return merged;
        });
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
        fetchWishlist(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
      if (session?.user) {
        fetchWishlist(session.user.id);
      } else {
        // When logged out, reset to local storage or empty
        const local = localStorage.getItem('pt_wishlist');
        setWishlistItems(local ? JSON.parse(local) : []);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const toggleLike = async (product: Product) => {
    setWishlistItems(prev => {
      const exists = prev.find(p => p.id === product.id);
      if (exists) {
        if (userId) supabase.from('wishlists').delete().eq('user_id', userId).eq('product_id', product.id).then();
        return prev.filter(p => p.id !== product.id);
      } else {
        if (userId) supabase.from('wishlists').insert({ user_id: userId, product_id: product.id }).then();
        toast.success(`${product.name} saved to wishlist!`, { icon: '💗' });
        return [...prev, product];
      }
    });
  };

  const removeFromWishlist = async (productId: string) => {
    setWishlistItems(prev => prev.filter(p => p.id !== productId));
    if (userId) {
      await supabase.from('wishlists').delete().eq('user_id', userId).eq('product_id', productId);
    }
  };

  const isLiked = useCallback((productId: string) => {
    return wishlistItems.some(p => p.id === productId);
  }, [wishlistItems]);

  return (
    <WishlistContext.Provider value={{
      wishlistItems, toggleLike, isLiked, isWishlistOpen, setIsWishlistOpen, removeFromWishlist
    }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) throw new Error('useWishlist must be used within a WishlistProvider');
  return context;
};
