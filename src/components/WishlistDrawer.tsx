import React from 'react';
import { useWishlist } from '../context/WishlistContext';
import { X, Heart, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

export const WishlistDrawer: React.FC = () => {
  const { wishlistItems, isWishlistOpen, setIsWishlistOpen, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  if (!isWishlistOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-[100] backdrop-blur-sm" 
        onClick={() => setIsWishlistOpen(false)}
      />
      <div className="fixed inset-y-0 right-0 max-w-md w-full bg-cream-dark z-[101] shadow-2xl flex flex-col transform transition-transform duration-300">
        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-200 bg-white">
          <h2 className="text-xl font-serif font-bold text-gray-900 flex items-center gap-2">
            <Heart className="h-5 w-5 text-maroon" fill="currentColor" /> Your Wishlist
          </h2>
          <button onClick={() => setIsWishlistOpen(false)} className="text-gray-500 hover:text-gray-900">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {wishlistItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
              <Heart className="h-16 w-16 text-gray-300 mb-4" />
              <p>You haven't saved any items yet.</p>
            </div>
          ) : (
            wishlistItems.map(product => (
              <div key={product.id} className="flex gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative group">
                <Link 
                  to={`/product/${product.id}`} 
                  onClick={() => setIsWishlistOpen(false)}
                  className="w-24 h-24 rounded-lg overflow-hidden bg-cream flex-shrink-0"
                >
                  <img src={product.images?.[0] || '/placeholder.png'} alt={product.name} className="w-full h-full object-cover" />
                </Link>
                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-1">
                    <Link 
                      to={`/product/${product.id}`} 
                      onClick={() => setIsWishlistOpen(false)}
                      className="font-bold text-gray-900 line-clamp-2 pr-6 hover:text-maroon"
                    >
                      {product.name}
                    </Link>
                    <button 
                      onClick={() => removeFromWishlist(product.id)} 
                      className="absolute top-4 right-4 text-gray-400 hover:text-maroon bg-white rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">{product.category}</p>
                  
                  <div className="mt-auto flex items-center justify-between">
                    <span className="font-bold text-maroon-dark">
                      ₹{product.price.toLocaleString()}
                    </span>
                    <button 
                      onClick={() => {
                        if (product.sizes.length > 0) {
                          addToCart(product, product.sizes[0]);
                          toast.success(`${product.name} added to cart`);
                        } else {
                          toast.error('No sizes available');
                        }
                      }}
                      className="text-xs bg-saddle hover:bg-saddle/90 text-white px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1"
                    >
                      <ShoppingBag className="h-3 w-3" /> Add
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};
