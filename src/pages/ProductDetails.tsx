import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { type Product } from '../data/products';
import { supabase } from '../lib/supabase';
import { useCart } from '../context/CartContext';
import { ShoppingBag, ArrowLeft, ShieldCheck, Truck, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { ProductReviews } from '../components/ProductReviews';

export const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart, setIsCartOpen } = useCart();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      setLoading(true);
      const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
      if (error) console.error(error);
      if (data) {
        setProduct(data as Product);
        setActiveImageIndex(0);
      }
      setLoading(false);
    };
    fetchProduct();
    setSelectedSize(null);
  }, [id]);

  const nextImage = () => {
    if (product && product.images && product.images.length > 1) {
      setActiveImageIndex((prev) => (prev + 1) % product.images.length);
    }
  };

  const prevImage = () => {
    if (product && product.images && product.images.length > 1) {
      setActiveImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 border-4 border-maroon border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
        <h2 className="text-3xl font-serif text-maroon-dark mb-4">Product Not Found</h2>
        <p className="text-gray-600 mb-8">The chappal you are looking for does not exist or has been removed.</p>
        <Link to="/" className="bg-maroon text-white px-6 py-3 rounded-full hover:bg-maroon-dark transition-colors font-medium">
          Return to Collections
        </Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast.error('Please select a size first');
      return;
    }
    if (product.stock_quantity > 0) {
      addToCart(product, selectedSize);
      toast.success(`${product.name} added to cart`);
      setIsCartOpen(true);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-500 hover:text-maroon transition-colors mb-8 group"
      >
        <ArrowLeft className="h-4 w-4 mr-2 transform group-hover:-translate-x-1 transition-transform" />
        Back
      </button>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Left: Image Gallery */}
        <div className="w-full lg:w-1/2 flex flex-col gap-4">
          <div className="bg-cream-dark rounded-3xl overflow-hidden shadow-sm border border-cream aspect-square relative group">
            <img 
              src={product.images?.[activeImageIndex] || '/placeholder.png'} 
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            
            {/* Arrows */}
            {product.images && product.images.length > 1 && (
              <>
                <button 
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-md backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button 
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-md backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            <div className="absolute top-4 left-4 flex flex-col gap-2">
              <span className="bg-white/90 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs font-bold text-maroon shadow-sm uppercase tracking-wider">
                {product.category}
              </span>
              {product.stock_quantity > 0 && product.stock_quantity <= 5 && (
                <span className="bg-saddle/90 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs font-bold text-white shadow-sm">
                  Only {product.stock_quantity} left
                </span>
              )}
            </div>
          </div>

          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="grid grid-cols-5 gap-3">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                    activeImageIndex === idx ? 'border-maroon opacity-100 ring-2 ring-maroon/20 ring-offset-2' : 'border-transparent opacity-60 hover:opacity-100 hover:border-gray-300'
                  }`}
                >
                  <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Info */}
        <div className="w-full lg:w-1/2 flex flex-col">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4 leading-tight">
            {product.name}
          </h1>
          
          <div className="text-3xl font-bold text-maroon-dark mb-6">
            ₹{product.price.toLocaleString()}
          </div>
          
          <p className="text-gray-600 text-lg mb-8 leading-relaxed">
            {product.description}
          </p>
          
          <div className="mb-8">
            <div className="flex justify-between items-end mb-4">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Select Size (UK/India)</h3>
              <button className="text-sm text-gray-500 hover:text-maroon underline underline-offset-4">Size Guide</button>
            </div>
            
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
              {product.sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`
                    py-3 rounded-xl border text-base font-medium transition-all duration-200
                    ${selectedSize === size 
                      ? 'bg-maroon border-maroon text-white shadow-md transform scale-[1.02]' 
                      : 'bg-white border-gray-200 text-gray-900 hover:border-maroon hover:text-maroon'
                    }
                  `}
                >
                  {size}
                </button>
              ))}
            </div>
            {product.sizes.length === 0 && (
              <p className="text-red-500 text-sm mt-2">Currently out of stock in all sizes.</p>
            )}
          </div>
          
          <button
            onClick={handleAddToCart}
            disabled={product.stock_quantity === 0 || product.sizes.length === 0}
            className="w-full bg-maroon hover:bg-maroon-dark text-white text-lg font-bold py-4 rounded-full shadow-lg transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed mb-8"
          >
            <ShoppingBag className="h-6 w-6" />
            {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>
          
          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 border-t border-gray-200 mt-auto">
            <div className="flex flex-col items-center text-center">
              <div className="h-10 w-10 bg-cream rounded-full flex items-center justify-center mb-3">
                <Truck className="h-5 w-5 text-saddle" />
              </div>
              <span className="text-sm font-medium text-gray-900">Free Shipping</span>
              <span className="text-xs text-gray-500 mt-1">Across India</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="h-10 w-10 bg-cream rounded-full flex items-center justify-center mb-3">
                <ShieldCheck className="h-5 w-5 text-saddle" />
              </div>
              <span className="text-sm font-medium text-gray-900">Premium Leather</span>
              <span className="text-xs text-gray-500 mt-1">100% Genuine</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="h-10 w-10 bg-cream rounded-full flex items-center justify-center mb-3">
                <RotateCcw className="h-5 w-5 text-saddle" />
              </div>
              <span className="text-sm font-medium text-gray-900">7 Days Return</span>
              <span className="text-xs text-gray-500 mt-1">Hassle free</span>
            </div>
          </div>
          
        </div>
      </div>

      <ProductReviews productId={product.id} />
    </div>
  );
};
