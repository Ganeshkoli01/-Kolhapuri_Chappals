import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { type Product, type Category } from '../../data/products';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import { CloudinaryUploader } from '../../components/admin/CloudinaryUploader';
import toast from 'react-hot-toast';

export const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (error) {
      toast.error('Failed to fetch products');
    } else {
      setProducts(data as Product[]);
    }
    setLoading(false);
  };

  const handleOpenModal = (product: Product | null = null) => {
    if (product) {
      setEditingProduct(product);
    } else {
      setEditingProduct({
        name: '',
        slug: '',
        description: '',
        price: 0,
        category: 'Men',
        sizes: [],
        stock_quantity: 0,
        images: [],
        is_trending: false
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      if (editingProduct.id) {
        // Update
        const { error } = await supabase
          .from('products')
          .update({
            name: editingProduct.name,
            slug: editingProduct.slug,
            description: editingProduct.description,
            price: editingProduct.price,
            category: editingProduct.category,
            sizes: editingProduct.sizes,
            stock_quantity: editingProduct.stock_quantity,
            images: editingProduct.images,
            is_trending: editingProduct.is_trending
          })
          .eq('id', editingProduct.id);
        if (error) throw error;
        toast.success('Product updated successfully');
      } else {
        // Insert
        const { error } = await supabase
          .from('products')
          .insert([editingProduct]);
        if (error) throw error;
        toast.success('Product created successfully');
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (error: any) {
      toast.error(error.message || 'Error saving product');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      toast.success('Product deleted');
      fetchProducts();
    } catch (error: any) {
      toast.error(error.message || 'Error deleting product');
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-serif font-bold text-gray-900">Manage Products</h1>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-maroon hover:bg-maroon-dark text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <Plus className="h-5 w-5" /> Add Product
        </button>
      </div>

      {['Men', 'Women', 'Kids'].map((category) => {
        const categoryProducts = products.filter(p => p.category === category);
        
        return (
          <div key={category} className="mb-10">
            <h2 className="text-xl font-serif font-bold text-gray-900 mb-4">{category} Products</h2>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-500">
                    <th className="p-4 w-20">Image</th>
                    <th className="p-4">Name</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">Stock</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500">Loading products...</td>
                    </tr>
                  ) : categoryProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500">No {category} products found.</td>
                    </tr>
                  ) : (
                    categoryProducts.map((product) => (
                      <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-4">
                          <img src={product.images?.[0] || '/placeholder.png'} alt={product.name} className="h-12 w-12 rounded object-cover border border-gray-200" />
                        </td>
                        <td className="p-4 font-medium text-gray-900">{product.name}</td>
                        <td className="p-4 text-gray-600">{product.category}</td>
                        <td className="p-4 text-gray-900 font-bold">₹{product.price}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${product.stock_quantity > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : 'Out of stock'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <button onClick={() => handleOpenModal(product)} className="text-blue-600 hover:text-blue-800 transition-colors" title="Edit">
                              <Edit className="h-5 w-5" />
                            </button>
                            <button onClick={() => handleDelete(product.id)} className="text-red-500 hover:text-red-700 transition-colors" title="Delete">
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {/* Add/Edit Modal */}
      {isModalOpen && editingProduct && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl relative my-8">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 z-10">
              <X className="h-6 w-6" />
            </button>
            <div className="p-8">
              <h2 className="text-2xl font-serif font-bold text-gray-900 mb-6">
                {editingProduct.id ? 'Edit Product' : 'Add New Product'}
              </h2>
              
              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input required type="text" className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-maroon"
                      value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL friendly)</label>
                    <input required type="text" className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-maroon"
                      value={editingProduct.slug} onChange={e => setEditingProduct({...editingProduct, slug: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                    <input required type="number" min="0" className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-maroon"
                      value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: Number(e.target.value)})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-maroon"
                      value={editingProduct.category} onChange={e => setEditingProduct({...editingProduct, category: e.target.value as Category})}>
                      <option value="Men">Men</option>
                      <option value="Women">Women</option>
                      <option value="Kids">Kids</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea required rows={3} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-maroon"
                      value={editingProduct.description} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                    <input required type="number" min="0" className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-maroon"
                      value={editingProduct.stock_quantity} onChange={e => setEditingProduct({...editingProduct, stock_quantity: Number(e.target.value)})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sizes (comma separated)</label>
                    <input type="text" placeholder="e.g. 7,8,9,10" className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-maroon"
                      value={editingProduct.sizes?.join(',')} 
                      onChange={e => setEditingProduct({...editingProduct, sizes: e.target.value.split(',').map(s => parseInt(s.trim())).filter(s => !isNaN(s))})} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Images</label>
                    <CloudinaryUploader 
                      images={editingProduct.images || []} 
                      onImagesChange={(imgs) => setEditingProduct({...editingProduct, images: imgs})}
                    />
                  </div>
                  <div className="md:col-span-2 flex items-center">
                    <input type="checkbox" id="trending" className="mr-2 accent-maroon"
                      checked={editingProduct.is_trending} onChange={e => setEditingProduct({...editingProduct, is_trending: e.target.checked})} />
                    <label htmlFor="trending" className="text-sm font-medium text-gray-700">Mark as Trending</label>
                  </div>
                </div>
                
                <div className="flex justify-end pt-4 border-t border-gray-100">
                  <button type="submit" className="bg-maroon hover:bg-maroon-dark text-white px-6 py-2 rounded-lg font-medium transition-colors">
                    Save Product
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
