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

  const [aiSummary, setAiSummary] = useState<any>(null);
  const [summarizing, setSummarizing] = useState(false);

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

  const summarizeReviews = async () => {
    if (reviews.length === 0) return;
    setSummarizing(true);
    try {
      const res = await fetch('/api/reviews/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property_id: propertyId })
      });
      const data = await res.json();
      if (data.success) {
        setAiSummary({ summary: data.summary, pros: data.pros, cons: data.cons });
        toast.success("AI has summarized the reviews!");
      } else {
        toast.error("Failed to summarize reviews.");
      }
    } catch (e) {
      toast.error("An error occurred during summarization.");
    } finally {
      setSummarizing(false);
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
        setComment('');
        setRating(5);
        fetchReviews(); // Refresh list to show the new review immediately
        // Reset AI summary if it exists so they can re-summarize including the new review
        if (aiSummary) setAiSummary(null);
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h3 style={{ fontSize: '20px', margin: 0 }}>Reviews ({reviews.length})</h3>
        {reviews.length >= 2 && !aiSummary && (
          <button 
            onClick={summarizeReviews} 
            disabled={summarizing}
            style={{
              padding: '8px 16px', background: 'linear-gradient(135deg, rgba(162, 53, 255, 0.1), rgba(162, 53, 255, 0.2))',
              color: 'var(--primary)', border: '1px solid rgba(162, 53, 255, 0.3)', borderRadius: '20px',
              cursor: summarizing ? 'not-allowed' : 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px'
            }}
          >
            {summarizing ? '✨ Analyzing...' : '✨ Summarize with AI'}
          </button>
        )}
      </div>

      {/* AI Summary Card */}
      {aiSummary && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(162, 53, 255, 0.05), rgba(74, 222, 128, 0.05))',
          border: '1px solid var(--primary)', borderRadius: '12px', padding: '20px', marginBottom: '30px',
          boxShadow: '0 4px 20px rgba(162, 53, 255, 0.1)'
        }}>
          <h4 style={{ color: 'var(--primary)', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ✨ AI Review Summary
          </h4>
          <p style={{ fontStyle: 'italic', color: 'var(--foreground)', marginBottom: '15px' }}>"{aiSummary.summary}"</p>
          
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 200px' }}>
              <h5 style={{ color: '#4ade80', margin: '0 0 10px 0' }}>✅ Pros</h5>
              <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-muted)' }}>
                {aiSummary.pros.map((pro: string, idx: number) => (
                  <li key={idx} style={{ marginBottom: '5px' }}>{pro}</li>
                ))}
              </ul>
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <h5 style={{ color: '#ef4444', margin: '0 0 10px 0' }}>❌ Cons</h5>
              <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-muted)' }}>
                {aiSummary.cons.map((con: string, idx: number) => (
                  <li key={idx} style={{ marginBottom: '5px' }}>{con}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
      
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
                  {review.user_id?.firstName || review.user_id?.name || 'User'} {review.user_id?.lastName || ''}
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
    </div>
  );
}
