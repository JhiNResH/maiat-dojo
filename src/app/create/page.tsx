"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Upload, Loader2 } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { useAutoCreateUser } from "@/hooks/useAutoCreateUser";

const CATEGORIES = ["Trading", "Security", "Content", "DeFi", "Analytics", "Infra", "Social"];

const EMOJI_OPTIONS = ["⚡", "🔍", "🛡️", "📊", "🎯", "🔒", "⛽", "🐦", "🤖", "💹", "🧠", "🔮", "🦅", "🥷", "💎", "🚀"];

export default function CreateSkillPage() {
  const router = useRouter();
  const { ready, authenticated, login, user } = usePrivy();
  useAutoCreateUser();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    longDescription: "",
    category: "Trading",
    icon: "⚡",
    price: "",
    tags: "",
    fileContent: "",
    fileType: "markdown",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!authenticated || !user) {
      setError("You must be signed in to create a skill.");
      return;
    }

    if (!formData.name.trim() || !formData.description.trim()) {
      setError("Name and description are required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/skills/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          privyId: user.id,
          email: user.email?.address,
          walletAddress: user.wallet?.address,
          displayName: user.google?.name ?? user.email?.address?.split("@")[0],
          name: formData.name.trim(),
          description: formData.description.trim(),
          longDescription: formData.longDescription.trim() || undefined,
          category: formData.category,
          icon: formData.icon,
          price: parseFloat(formData.price) || 0,
          tags: formData.tags.trim(),
          fileContent: formData.fileContent.trim() || undefined,
          fileType: formData.fileType,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create skill");
      }

      const skill = await response.json();
      router.push(`/skill/${skill.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show login prompt if not authenticated
  if (ready && !authenticated) {
    return (
      <div className="min-h-screen bg-[#f0ece2]">
        <div className="max-w-2xl mx-auto px-8 py-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-mono text-[#8b0000] hover:underline mb-8"
          >
            <ArrowLeft size={14} />
            Back to Dojo
          </Link>

          <div className="text-center py-16">
            <h1 className="font-serif font-black text-4xl text-[#1a1a1a] mb-4">
              Become a Sensei
            </h1>
            <p className="font-serif text-lg text-[#1a1a1a]/60 mb-8 max-w-md mx-auto">
              Sign in to create and publish skills for AI agents. Earn 85% of every sale.
            </p>
            <button
              onClick={login}
              className="bg-[#1a1a1a] text-[#f0ece2] font-mono text-sm px-8 py-3 hover:bg-[#1a1a1a]/80 transition-colors tracking-[0.2em]"
            >
              SIGN IN TO CONTINUE
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0ece2]">
      <div className="max-w-2xl mx-auto px-8 py-12">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-mono text-[#8b0000] hover:underline mb-8"
        >
          <ArrowLeft size={14} />
          Back to Dojo
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="rule-ornament mb-4">✦ PUBLISH ✦</div>
          <h1 className="font-serif font-black text-5xl text-[#1a1a1a] mb-2">
            Create a Skill
          </h1>
          <p className="font-serif italic text-[#1a1a1a]/50">
            Teach AI agents new capabilities. Earn 85% on every purchase.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#1a1a1a]/50 mb-2">
              Skill Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. DeFi Yield Optimizer"
              className="w-full bg-transparent border-2 border-[#1a1a1a]/20 px-4 py-3 font-serif text-lg focus:border-[#1a1a1a] focus:outline-none transition-colors placeholder:text-[#1a1a1a]/20"
              maxLength={100}
              required
            />
          </div>

          {/* Short Description */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#1a1a1a]/50 mb-2">
              Short Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Brief description of what this skill does (1-2 sentences)"
              rows={2}
              className="w-full bg-transparent border-2 border-[#1a1a1a]/20 px-4 py-3 font-serif focus:border-[#1a1a1a] focus:outline-none transition-colors placeholder:text-[#1a1a1a]/20 resize-none"
              maxLength={300}
              required
            />
          </div>

          {/* Long Description */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#1a1a1a]/50 mb-2">
              Detailed Description
            </label>
            <textarea
              name="longDescription"
              value={formData.longDescription}
              onChange={handleChange}
              placeholder="Provide a detailed explanation of the skill's capabilities, use cases, and how it works..."
              rows={6}
              className="w-full bg-transparent border-2 border-[#1a1a1a]/20 px-4 py-3 font-serif focus:border-[#1a1a1a] focus:outline-none transition-colors placeholder:text-[#1a1a1a]/20 resize-none"
            />
          </div>

          {/* Category & Icon Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#1a1a1a]/50 mb-2">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full bg-transparent border-2 border-[#1a1a1a]/20 px-4 py-3 font-mono focus:border-[#1a1a1a] focus:outline-none transition-colors cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Icon */}
            <div className="relative">
              <label className="block text-xs font-mono uppercase tracking-wider text-[#1a1a1a]/50 mb-2">
                Icon
              </label>
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="w-full bg-transparent border-2 border-[#1a1a1a]/20 px-4 py-3 text-left font-mono focus:border-[#1a1a1a] focus:outline-none transition-colors flex items-center gap-3"
              >
                <span className="text-2xl">{formData.icon}</span>
                <span className="text-[#1a1a1a]/40 text-sm">Click to change</span>
              </button>
              {showEmojiPicker && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#f0ece2] border-2 border-[#1a1a1a]/20 p-3 grid grid-cols-8 gap-2 z-10">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, icon: emoji }));
                        setShowEmojiPicker(false);
                      }}
                      className={`text-2xl p-2 hover:bg-[#1a1a1a]/10 transition-colors ${
                        formData.icon === emoji ? "bg-[#1a1a1a]/10" : ""
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Price */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#1a1a1a]/50 mb-2">
              Price (USD)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-[#1a1a1a]/40">
                $
              </span>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full bg-transparent border-2 border-[#1a1a1a]/20 pl-8 pr-4 py-3 font-mono focus:border-[#1a1a1a] focus:outline-none transition-colors placeholder:text-[#1a1a1a]/20"
              />
            </div>
            <p className="text-xs font-mono text-[#1a1a1a]/35 mt-1">
              Leave empty or 0 for free skills
            </p>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#1a1a1a]/50 mb-2">
              Tags
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="e.g. yield, farming, apy, defi, optimization"
              className="w-full bg-transparent border-2 border-[#1a1a1a]/20 px-4 py-3 font-mono focus:border-[#1a1a1a] focus:outline-none transition-colors placeholder:text-[#1a1a1a]/20"
            />
            <p className="text-xs font-mono text-[#1a1a1a]/35 mt-1">
              Comma-separated keywords to help agents find your skill
            </p>
          </div>

          {/* Skill Content Section */}
          <div className="border-t-2 border-double border-[#1a1a1a]/20 pt-6">
            <div className="rule-ornament mb-4">✦ SKILL INSTRUCTIONS ✦</div>

            {/* File Type */}
            <div className="mb-4">
              <label className="block text-xs font-mono uppercase tracking-wider text-[#1a1a1a]/50 mb-2">
                Content Type
              </label>
              <select
                name="fileType"
                value={formData.fileType}
                onChange={handleChange}
                className="w-full bg-transparent border-2 border-[#1a1a1a]/20 px-4 py-3 font-mono focus:border-[#1a1a1a] focus:outline-none transition-colors cursor-pointer"
              >
                <option value="markdown">Markdown (.md)</option>
                <option value="json">JSON</option>
                <option value="text">Plain Text</option>
              </select>
            </div>

            {/* File Content */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#1a1a1a]/50 mb-2">
                Skill Instructions
              </label>
              <textarea
                name="fileContent"
                value={formData.fileContent}
                onChange={handleChange}
                placeholder={`# ${formData.name || "Skill Name"}

## Overview
Describe what this skill does and how an agent should use it.

## Instructions
Step-by-step instructions for the AI agent to follow.

## Examples
\`\`\`
Example input/output pairs
\`\`\`

## Configuration
Any required API keys or settings.`}
                rows={12}
                className="w-full bg-transparent border-2 border-[#1a1a1a]/20 px-4 py-3 font-mono text-sm focus:border-[#1a1a1a] focus:outline-none transition-colors placeholder:text-[#1a1a1a]/20 resize-none"
              />
              <p className="text-xs font-mono text-[#1a1a1a]/35 mt-1">
                The actual instructions buyers will receive. This is delivered after purchase.
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t-2 border-double border-[#1a1a1a]/20 pt-6">
            {/* Error */}
            {error && (
              <div className="mb-4 p-4 border-2 border-[#8b0000]/30 bg-[#8b0000]/5">
                <p className="text-sm font-mono text-[#8b0000]">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#1a1a1a] text-[#f0ece2] font-mono text-sm px-8 py-4 hover:bg-[#1a1a1a]/80 transition-colors tracking-[0.2em] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  PUBLISHING...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  PUBLISH SKILL
                </>
              )}
            </button>

            <p className="text-xs font-mono text-[#1a1a1a]/35 text-center mt-4">
              By publishing, you agree to the Dojo Creator Terms
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
