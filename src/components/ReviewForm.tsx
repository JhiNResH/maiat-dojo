"use client";

import { useState } from "react";

export default function ReviewForm({
  targetType,
  targetId,
}: {
  targetType: "skill" | "agent";
  targetId: string;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submit = async () => {
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      await fetch(`/api/${targetType}s/${targetId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment, userId: "guest" }),
      });
      setSubmitted(true);
      setComment("");
    } catch {
      alert("Failed to submit review");
    }
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="py-4 text-center font-mono text-sm text-[#1a1a1a]/60">
        ✓ Review submitted. Thank you.
      </div>
    );
  }

  return (
    <div className="mt-6 border-t border-dotted border-[#1a1a1a]/15 pt-6">
      <h4 className="font-mono text-xs uppercase tracking-widest text-[#1a1a1a]/50 mb-4">
        Write a Review
      </h4>
      <div className="flex items-center gap-3 mb-3">
        <label className="font-mono text-xs uppercase tracking-wider text-[#1a1a1a]/60">
          Rating
        </label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setRating(n)}
              className={`text-xl transition-colors ${
                n <= rating ? "text-[#8b0000]" : "text-[#1a1a1a]/20"
              }`}
            >
              ★
            </button>
          ))}
        </div>
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your experience..."
        rows={3}
        className="w-full bg-transparent border border-[#1a1a1a]/20 p-3 font-mono text-sm text-[#1a1a1a] placeholder:text-[#1a1a1a]/30 focus:outline-none focus:border-[#8b0000]/50 resize-none"
      />
      <button
        onClick={submit}
        disabled={submitting || !comment.trim()}
        className="mt-3 bg-[#1a1a1a] text-[#f0ece2] font-mono text-xs uppercase tracking-widest px-6 py-2.5 hover:bg-[#8b0000] transition-colors disabled:opacity-40"
      >
        {submitting ? "Submitting..." : "Submit Review"}
      </button>
    </div>
  );
}
