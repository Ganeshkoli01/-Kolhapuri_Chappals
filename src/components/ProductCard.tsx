import React from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../data/products';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (product.sizes.length > 0) {
      addToCart(product, product.sizes[0]);
      toast.success(`${product.name} added to cart`);
    } else {
      toast.error('No sizes available');
    }
  };
  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-cream-dark flex flex-col h-full">
      {/* Image Container */}
      <Link to={`/product/${product.id}`} className="relative aspect-square overflow-hidden bg-cream-dark block">
        <img 
          src={product.images?.[0] || '/placeholder.png'} 
          alt={product.name} 
          className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-500"
        />
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          <span className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-maroon shadow-sm uppercase tracking-wider">
            {product.category}
          </span>
          {product.stock_quantity > 0 && product.stock_quantity <= 5 && (
            <span className="bg-saddle/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm">
              Only {product.stock_quantity} left
            </span>
          )}
          {product.stock_quantity === 0 && (
            <span className="bg-gray-800/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm">
              Out of stock
            </span>
          )}
        </div>
      </Link>
      
      {/* Content */}
      <div className="p-5 flex flex-col flex-grow">
        <div className="mb-2">
          <Link to={`/product/${product.id}`}>
            <h3 className="font-serif font-bold text-lg text-gray-900 leading-snug group-hover:text-maroon transition-colors line-clamp-1">
              {product.name}
            </h3>
          </Link>
          <p className="text-gray-500 text-sm mt-1 line-clamp-2">{product.description}</p>
        </div>
        
        <div className="mt-auto pt-4 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Price</span>
            <span className="font-bold text-xl text-maroon-dark">₹{product.price.toLocaleString()}</span>
          </div>
          <button 
            onClick={handleAddToCart}
            className="h-12 w-12 rounded-full bg-cream flex items-center justify-center text-saddle hover:bg-maroon hover:text-white transition-colors relative z-10"
            disabled={product.stock_quantity === 0}
            title={product.stock_quantity === 0 ? "Out of stock" : "Add to cart"}
          >
            <ShoppingBag className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
