import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { CloudinaryUploader } from './admin/CloudinaryUploader';

interface Review {
  id: string;
  rating: number;
  comment: string;
  images?: string[];
  created_at: string;
  user_id: string;
  profiles?: {
    full_name: string;
  };
}

interface ProductReviewsProps {
  productId: string;
}

export const ProductReviews: React.FC<ProductReviewsProps> = ({ productId }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  
  // User state
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasOrdered, setHasOrdered] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  
  // Form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewImages, setReviewImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews();
    checkUserStatus();
  }, [productId]);

  const checkUserStatus = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
        
      if (profile?.role === 'admin') {
        setIsAdmin(true);
      }
      
      // Check if user has already reviewed
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('product_id', productId)
        .eq('user_id', session.user.id)
        .single();
        
      if (existingReview) {
        setHasReviewed(true);
      }
      
      // Check if user has ordered this product via RPC
      try {
        const { data: ordered } = await supabase.rpc('has_user_ordered_product', {
          p_user_id: session.user.id,
          p_product_id: productId
        });
        
        setHasOrdered(!!ordered);
      } catch (err) {
        console.error("RPC Error:", err);
        setHasOrdered(false);
      }
    }
  };

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          images,
          created_at,
          user_id,
          profiles ( full_name )
        `)
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data as any || []);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !hasOrdered) return;
    
    setSubmitting(true);
    try {
      if (editingReviewId) {
        const { error } = await supabase
          .from('reviews')
          .update({
            rating,
            comment,
            images: reviewImages
          })
          .eq('id', editingReviewId);

        if (error) throw error;
        toast.success('Review updated successfully!');
        setEditingReviewId(null);
        setRating(5);
        setComment('');
        setReviewImages([]);
      } else {
        const { error } = await supabase
          .from('reviews')
          .insert([
            {
              product_id: productId,
              user_id: user.id,
              rating,
              comment,
              images: reviewImages
            }
          ]);

        if (error) throw error;
        toast.success('Review submitted successfully!');
        setHasReviewed(true);
      }
      
      fetchReviews();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (review: Review) => {
    setEditingReviewId(review.id);
    setRating(review.rating);
    setComment(review.comment);
    setReviewImages(review.images || []);
    
    const formEl = document.getElementById('review-form');
    if (formEl) formEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    
    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      toast.success('Review deleted');
      
      if (id === editingReviewId) {
        setEditingReviewId(null);
        setRating(5);
        setComment('');
        setReviewImages([]);
      }
      
      const deletedReview = reviews.find(r => r.id === id);
      if (deletedReview && deletedReview.user_id === user?.id) {
        setHasReviewed(false);
      }
      
      fetchReviews();
    } catch (err: any) {
      toast.error('Failed to delete review');
    }
  };

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length).toFixed(1)
    : 0;

  return (
    <div className="mt-16 pt-16 border-t border-gray-200">
      <h2 className="text-3xl font-serif font-bold text-gray-900 mb-8 flex items-center gap-3">
        <MessageSquare className="h-6 w-6 text-maroon" />
        Customer Reviews
      </h2>

      <div className="flex flex-col md:flex-row gap-12">
        {/* Left: Summary & Form */}
        <div className="w-full md:w-1/3">
          <div className="bg-cream p-6 rounded-2xl mb-8">
            <div className="text-5xl font-bold text-maroon-dark mb-2">{averageRating}</div>
            <div className="flex items-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star} 
                  className={`h-5 w-5 ${star <= Number(averageRating) ? 'fill-maroon text-maroon' : 'fill-gray-200 text-gray-200'}`} 
                />
              ))}
            </div>
            <p className="text-gray-600 text-sm">Based on {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</p>
          </div>

          {user ? (
            hasOrdered ? (
              hasReviewed && !editingReviewId ? (
                <div className="bg-green-50 border border-green-100 p-4 rounded-xl text-green-800 text-sm">
                  Thank you! You have already reviewed this product.
                </div>
              ) : (
                <form id="review-form" onSubmit={handleSubmit} className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-4">{editingReviewId ? 'Edit Review' : 'Write a Review'}</h3>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="focus:outline-none"
                        >
                          <Star className={`h-6 w-6 ${star <= rating ? 'fill-maroon text-maroon' : 'text-gray-300'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Comment</label>
                    <textarea 
                      required
                      rows={4}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="w-full border-gray-200 bg-gray-50 border rounded-lg px-4 py-2 focus:ring-1 focus:ring-maroon focus:border-maroon outline-none transition-all resize-none"
                      placeholder="What did you like or dislike?"
                    ></textarea>
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Add Photos (Optional)</label>
                    <CloudinaryUploader 
                      images={reviewImages} 
                      onImagesChange={setReviewImages} 
                      maxImages={3}
                    />
                  </div>
                  
                  <button 
                    type="submit" 
                    disabled={submitting}
                    className="w-full bg-maroon text-white py-2.5 rounded-lg font-medium hover:bg-maroon-dark transition-colors disabled:opacity-70"
                  >
                    {submitting ? (editingReviewId ? 'Updating...' : 'Submitting...') : (editingReviewId ? 'Update Review' : 'Submit Review')}
                  </button>
                  
                  {editingReviewId && (
                    <button 
                      type="button" 
                      onClick={() => {
                        setEditingReviewId(null);
                        setRating(5);
                        setComment('');
                        setReviewImages([]);
                      }}
                      className="w-full mt-3 bg-white text-gray-600 border border-gray-200 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    >
                      Cancel Edit
                    </button>
                  )}
                </form>
              )
            ) : (
              <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl text-gray-600 text-sm text-center">
                You must purchase this product to leave a review.
              </div>
            )
          ) : (
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl text-gray-600 text-sm text-center">
              Please sign in to leave a review.
            </div>
          )}
        </div>

        {/* Right: Reviews List */}
        <div className="w-full md:w-2/3">
          {loading ? (
            <div className="animate-pulse flex flex-col gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-100 rounded-2xl"></div>
              ))}
            </div>
          ) : reviews.length > 0 ? (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium text-gray-900">
                        {review.profiles?.full_name || 'Verified Customer'}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {new Date(review.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} 
                            className={`h-4 w-4 ${star <= review.rating ? 'fill-saddle text-saddle' : 'fill-gray-200 text-gray-200'}`} 
                          />
                        ))}
                      </div>
                      
                      {(user?.id === review.user_id || isAdmin) && (
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleEditClick(review)}
                            className="text-gray-400 hover:text-maroon transition-colors"
                            title="Edit Review"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(review.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                            title="Delete Review"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-600 mt-3 text-sm leading-relaxed">{review.comment}</p>
                  
                  {review.images && review.images.length > 0 && (
                    <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                      {review.images.map((img, idx) => (
                        <a key={idx} href={img} target="_blank" rel="noopener noreferrer" className="block flex-shrink-0">
                          <img 
                            src={img} 
                            alt={`Review photo ${idx + 1}`} 
                            className="h-24 w-24 object-cover rounded-lg border border-gray-200 hover:border-maroon transition-colors"
                          />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-100 border-dashed">
              <MessageSquare className="h-8 w-8 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No reviews yet</h3>
              <p className="text-gray-500 text-sm">Be the first to review this product after purchasing!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
