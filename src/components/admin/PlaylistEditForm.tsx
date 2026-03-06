'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface PlaylistEditFormProps {
  playlist: {
    id: string;
    title: string;
    description: string | null;
    isPublic: boolean | null;
  };
}

export function PlaylistEditForm({ playlist }: PlaylistEditFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(playlist.title);
  const [description, setDescription] = useState(playlist.description ?? '');
  const [isPublic, setIsPublic] = useState(playlist.isPublic ?? true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setMessage({ type: 'error', text: 'Title is required' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/playlists/${playlist.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          isPublic,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'Failed to save' });
        return;
      }

      setMessage({ type: 'success', text: 'Playlist updated' });
      router.refresh();
    } catch {
      setMessage({ type: 'error', text: 'Failed to save' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/playlists/${playlist.id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) {
        setMessage({ type: 'error', text: 'Failed to delete playlist' });
        setDeleting(false);
        return;
      }
      router.push('/admin/playlists');
    } catch {
      setMessage({ type: 'error', text: 'Failed to delete playlist' });
      setDeleting(false);
    }
  }

  return (
    <div className="bg-surface border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-foreground">Playlist Settings</h2>
        <Link
          href="/admin/playlists"
          className="text-muted hover:text-foreground text-sm transition-colors inline-flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Back
        </Link>
      </div>

      {message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm mb-4 ${
            message.type === 'success'
              ? 'bg-[#4ADE801A] border border-[#4ADE80] text-[#4ADE80]'
              : 'bg-[#F871711A] border border-[#F87171] text-[#F87171]'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5">
        <div>
          <label htmlFor="edit-title" className="block text-sm font-medium text-foreground mb-2">
            Title
          </label>
          <input
            id="edit-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            required
            className="w-full px-4 py-2.5 bg-[#1E1E22] border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#6B8AFF] transition-colors"
          />
        </div>

        <div>
          <label htmlFor="edit-description" className="block text-sm font-medium text-foreground mb-2">
            Description
          </label>
          <textarea
            id="edit-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-4 py-2.5 bg-[#1E1E22] border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#6B8AFF] transition-colors resize-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={isPublic}
            onClick={() => setIsPublic(!isPublic)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B8AFF] ${
              isPublic ? 'bg-accent' : 'bg-[#2A2A30]'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transform transition-transform ${
                isPublic ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
          <span className="text-sm text-foreground">
            {isPublic ? 'Public' : 'Private'}
          </span>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <button
            type="submit"
            disabled={saving || !title.trim()}
            className="px-5 py-2.5 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white rounded-lg transition-colors text-sm font-medium min-h-[44px]"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>

          <div className="flex items-center gap-2">
            {confirmDelete && (
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="px-4 py-2.5 border border-border hover:bg-surface-hover text-foreground rounded-lg transition-colors text-sm min-h-[44px]"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className={`px-4 py-2.5 rounded-lg transition-colors text-sm font-medium min-h-[44px] ${
                confirmDelete
                  ? 'bg-[#F87171] hover:bg-[#EF4444] text-white'
                  : 'border border-[#F87171] text-[#F87171] hover:bg-[#F871711A]'
              }`}
            >
              {deleting ? 'Deleting...' : confirmDelete ? 'Confirm Delete' : 'Delete Playlist'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
