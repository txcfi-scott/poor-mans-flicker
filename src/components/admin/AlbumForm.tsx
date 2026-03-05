'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Album {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  isPublic: boolean;
  isHero: boolean;
}

interface AlbumFormProps {
  album?: Album;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function AlbumForm({ album }: AlbumFormProps) {
  const router = useRouter();
  const isEdit = !!album;

  const [title, setTitle] = useState(album?.title ?? '');
  const [description, setDescription] = useState(album?.description ?? '');
  const [isPublic, setIsPublic] = useState(album?.isPublic ?? true);
  const [isHero, setIsHero] = useState(album?.isHero ?? false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const slug = useMemo(() => generateSlug(title), [title]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    // Client-side validation
    const newErrors: Record<string, string> = {};
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!slug) {
      newErrors.title = 'Title must produce a valid slug';
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const url = isEdit ? `/api/albums/${album.id}` : '/api/albums';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          isPublic,
          isHero,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.errors && typeof data.errors === 'object') {
          setErrors(data.errors);
        } else {
          setErrors({ form: data.error || 'Something went wrong' });
        }
        return;
      }

      router.push('/admin/albums');
    } catch {
      setErrors({ form: 'Network error. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.form && (
        <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">
          {errors.form}
        </div>
      )}

      {/* Title */}
      <div className="flex flex-col">
        <label htmlFor="title" className="text-sm text-muted mb-1">
          Title
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Album title"
          className="bg-surface border border-border text-foreground rounded-lg px-4 py-2 focus:border-accent focus:outline-none"
        />
        {slug && (
          <p className="text-xs text-muted mt-1">
            Slug: <span className="text-foreground font-mono">{slug}</span>
          </p>
        )}
        {errors.title && (
          <p className="text-xs text-red-400 mt-1">{errors.title}</p>
        )}
      </div>

      {/* Description */}
      <div className="flex flex-col">
        <label htmlFor="description" className="text-sm text-muted mb-1">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description"
          rows={4}
          className="bg-surface border border-border text-foreground rounded-lg px-4 py-2 focus:border-accent focus:outline-none resize-y"
        />
      </div>

      {/* Checkboxes */}
      <div className="space-y-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="w-4 h-4 rounded border-border bg-surface accent-accent"
          />
          <span className="text-sm text-foreground">Public</span>
          <span className="text-xs text-muted">Visible to visitors</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isHero}
            onChange={(e) => setIsHero(e.target.checked)}
            className="w-4 h-4 rounded border-border bg-surface accent-accent"
          />
          <span className="text-sm text-foreground">Hero</span>
          <span className="text-xs text-muted">Include photos in homepage hero slideshow</span>
        </label>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-accent hover:bg-accent-hover text-white px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Album'}
        </button>
        <Link
          href="/admin/albums"
          className="text-muted hover:text-foreground transition-colors"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
