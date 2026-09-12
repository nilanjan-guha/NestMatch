'use client';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useUser } from '@clerk/nextjs';

export default function ReviewsSection({ propertyId }: { propertyId: string }) {
  const { isSignedIn } = useUser();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [propertyId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/reviews?property_id=${propertyId}`);
      const data = await res.json();
      if (data.success) {
        setReviews(data.reviews);
      }
    } catch (e) {
      console.error('Failed to fetch reviews', e);
    } finally {
      setLoading(false);
    }
  };

  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignedIn) {
      toast.error('You must be signed in to leave a review.');
      return;
    }
    if (!comment.trim()) {
      toast.error('Please enter a comment.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property_id: propertyId, rating, comment })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Review submitted successfully!');
        fetchReviews(); // Refresh list
        
        // If rating is high, ask them to copy to Google Maps
        if (rating >= 4) {
          // You can replace this with actual Google Maps place ID link from property data if available
          setGoogleMapsUrl('https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4');
          setShowGoogleModal(true);
        } else {
          setComment('');
          setRating(5);
        }
      } else {
        toast.error(data.error || 'Failed to submit review');
      }
    } catch (e) {
      toast.error('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ marginTop: '30px', borderTop: '1px solid var(--surface-border)', paddingTop: '20px' }}>
      <h3 style={{ fontSize: '20px', marginBottom: '20px' }}>Reviews ({reviews.length})</h3>
      
      {/* Review Form */}
      {isSignedIn ? (
        <form onSubmit={handleSubmit} style={{ marginBottom: '30px', background: 'var(--surface)', padding: '20px', borderRadius: '12px' }}>
          <h4 style={{ marginBottom: '10px' }}>Leave a Review</h4>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: 'var(--text-muted)' }}>Rating</label>
            <div style={{ display: 'flex', gap: '5px' }}>
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: '24px', color: star <= rating ? 'gold' : 'var(--surface-border)'
                  }}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: '15px' }}>
            <textarea 
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience..."
              style={{ width: '100%', minHeight: '80px', padding: '10px', borderRadius: '8px', border: '1px solid var(--surface-border)', background: 'var(--background)', color: 'var(--foreground)' }}
            />
          </div>
          <button 
            type="submit" 
            disabled={submitting}
            style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      ) : (
        <div style={{ marginBottom: '30px', padding: '15px', background: 'var(--surface)', borderRadius: '8px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>Sign in to leave a review</p>
        </div>
      )}

      {/* Review List */}
      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading reviews...</p>
      ) : reviews.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {reviews.map(review => (
            <div key={review._id} style={{ background: 'var(--surface)', padding: '15px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ fontWeight: 'bold' }}>
                  {review.user_id?.firstName} {review.user_id?.lastName}
                </div>
                <div style={{ color: 'gold' }}>
                  {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                </div>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', whiteSpace: 'pre-wrap' }}>{review.comment}</p>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '10px' }}>
                {new Date(review.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ color: 'var(--text-muted)' }}>No reviews yet. Be the first to review!</p>
      )}

      {/* Google Maps Redirect Modal */}
      {showGoogleModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'var(--background)', padding: '30px', borderRadius: '12px', maxWidth: '400px', width: '90%', textAlign: 'center', border: '1px solid var(--surface-border)' }}>
            <h3 style={{ fontSize: '24px', marginBottom: '15px' }}>Thank you! 🎉</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
              We're so glad you had a great experience. Would you mind copying your review and pasting it on Google Maps? It really helps us!
            </p>
            <div style={{ background: 'var(--surface)', padding: '15px', borderRadius: '8px', marginBottom: '20px', textAlign: 'left', fontSize: '14px', color: 'var(--foreground)' }}>
              "{comment}"
            </div>
            <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(comment);
                  toast.success('Review copied!');
                  window.open(googleMapsUrl, '_blank');
                  setShowGoogleModal(false);
                  setComment('');
                  setRating(5);
                }}
                style={{ background: 'linear-gradient(45deg, var(--primary), var(--secondary))', color: 'white', padding: '12px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Copy & Open Google Maps
              </button>
              <button 
                onClick={() => {
                  setShowGoogleModal(false);
                  setComment('');
                  setRating(5);
                }}
                style={{ background: 'transparent', color: 'var(--text-muted)', padding: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
              >
                No thanks
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
