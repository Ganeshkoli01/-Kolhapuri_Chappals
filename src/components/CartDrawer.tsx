import React from 'react';
import { useCart } from '../context/CartContext';
import { X, Minus, Plus, ShoppingBag } from 'lucide-react';

interface CartDrawerProps {
  onCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onCheckout }) => {
  const { items, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, totalAmount } = useCart();

  if (!isCartOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-[100] backdrop-blur-sm" 
        onClick={() => setIsCartOpen(false)}
      />
      <div className="fixed inset-y-0 right-0 max-w-md w-full bg-cream-dark z-[101] shadow-2xl flex flex-col transform transition-transform duration-300">
        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-200 bg-white">
          <h2 className="text-xl font-serif font-bold text-gray-900 flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" /> Your Cart
          </h2>
          <button onClick={() => setIsCartOpen(false)} className="text-gray-500 hover:text-gray-900">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
              <ShoppingBag className="h-16 w-16 text-gray-300 mb-4" />
              <p>Your cart is empty.</p>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="flex gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-cream flex-shrink-0">
                  <img src={item.product.images?.[0] || '/placeholder.png'} alt={item.product.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-gray-900 line-clamp-1">{item.product.name}</h3>
                    <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-maroon">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">Size: {item.size}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center bg-cream rounded-lg border border-gray-200">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 text-gray-600 hover:text-maroon"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 text-gray-600 hover:text-maroon"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <span className="font-bold text-maroon-dark">
                      ₹{(item.product.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="p-6 border-t border-gray-200 bg-white">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600 font-medium">Subtotal</span>
              <span className="text-xl font-bold text-gray-900">₹{totalAmount.toLocaleString()}</span>
            </div>
            <button 
              onClick={() => {
                setIsCartOpen(false);
                onCheckout();
              }}
              className="w-full bg-maroon hover:bg-maroon-dark text-white py-4 rounded-xl font-medium transition-colors shadow-lg"
            >
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </>
  );
};
