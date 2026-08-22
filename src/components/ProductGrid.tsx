import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { type Category, type Product } from '../data/products';
import { supabase } from '../lib/supabase';
import { ProductCard } from './ProductCard';
import { Filter, X, Search } from 'lucide-react';

export const ProductGrid: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const categoryParam = searchParams.get('category') as Category | 'All' | null;
  
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>(categoryParam || 'All');
  
  useEffect(() => {
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [categoryParam]);

  useEffect(() => {
    if (location.hash === '#products') {
      const el = document.getElementById('products');
      if (el) {
        // slight delay ensures layout is ready
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 50);
      }
    }
  }, [location.hash, location.search]);
  
  const handleCategoryChange = (cat: Category | 'All') => {
    setSelectedCategory(cat);
    setSearchParams(prev => {
      prev.set('category', cat);
      return prev;
    });
  };
  
  const qParam = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(qParam);

  useEffect(() => {
    setSearchQuery(searchParams.get('q') || '');
  }, [searchParams]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setSearchParams(prev => {
      if (val) prev.set('q', val);
      else prev.delete('q');
      return prev;
    });
  };

  const [maxPrice, setMaxPrice] = useState(3000);
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  
  const [dbProducts, setDbProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase.from('products').select('*');
      if (error) {
        console.error('Error fetching products:', error);
      } else {
        setDbProducts(data as Product[]);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    return dbProducts.filter((product) => {
      const matchCategory = selectedCategory === 'All' || product.category === selectedCategory;
      const matchSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchPrice = product.price <= maxPrice;
      const matchSize = selectedSize === null || product.sizes.includes(selectedSize);
      
      return matchCategory && matchSearch && matchPrice && matchSize;
    });
  }, [selectedCategory, searchQuery, maxPrice, selectedSize]);

  const clearFilters = () => {
    handleCategoryChange('All');
    handleSearchChange('');
    setMaxPrice(3000);
    setSelectedSize(null);
  };

  return (
    <div id="products" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 scroll-mt-20">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Filters */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="sticky top-28 space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-serif font-bold text-gray-900 flex items-center gap-2">
                <Filter className="h-5 w-5" /> Filters
              </h2>
              <button 
                onClick={clearFilters}
                className="text-xs font-medium text-maroon hover:text-maroon-dark flex items-center gap-1"
              >
                <X className="h-3 w-3" /> Clear
              </button>
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input 
                type="text" 
                placeholder="Find a style..." 
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full border-gray-200 bg-white border rounded-lg px-4 py-2 focus:ring-1 focus:ring-maroon focus:border-maroon outline-none transition-all"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Category</label>
              <div className="flex flex-wrap gap-2">
                {['All', 'Men', 'Women', 'Kids'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleCategoryChange(cat as any)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === cat 
                        ? 'bg-maroon text-white' 
                        : 'bg-white border border-gray-200 text-gray-700 hover:border-maroon hover:text-maroon'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Price: ₹{maxPrice}
              </label>
              <input 
                type="range" 
                min="500" 
                max="3000" 
                step="100"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-maroon"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>₹500</span>
                <span>₹3000</span>
              </div>
            </div>

            {/* Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Size (UK/India)</label>
              <div className="grid grid-cols-4 gap-2">
                {[4, 5, 6, 7, 8, 9, 10, 11, 12].map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(selectedSize === size ? null : size)}
                    className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedSize === size
                        ? 'bg-saddle text-white border-transparent'
                        : 'bg-white border border-gray-200 text-gray-700 hover:border-saddle hover:text-saddle'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
            
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1">
          <div className="mb-6 flex justify-between items-end border-b border-gray-200 pb-4">
            <h2 className="text-3xl font-serif font-bold text-gray-900">
              Trending Now
            </h2>
            <span className="text-sm text-gray-500">
              Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'result' : 'results'}
            </span>
          </div>
          
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-cream rounded-full flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-500 max-w-sm mx-auto mb-6">
                We couldn't find anything matching your current filters. Try adjusting your search or clearing filters.
              </p>
              <button 
                onClick={clearFilters}
                className="px-6 py-2 bg-maroon text-white rounded-full font-medium hover:bg-maroon-dark transition-colors"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
};
