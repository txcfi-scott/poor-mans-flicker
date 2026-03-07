'use client';

import { useState } from 'react';

interface SiteConfig {
  siteTitle: string;
  siteDescription: string;
  heroIntervalMs: number;
  slideshowDefaultIntervalMs: number;
  trashRetentionDays: number;
  aboutHeading: string;
  aboutText: string;
}

export default function SettingsForm({ initialConfig }: { initialConfig: SiteConfig }) {
  const [config, setConfig] = useState(initialConfig);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteTitle: config.siteTitle,
          siteDescription: config.siteDescription,
          heroIntervalMs: config.heroIntervalMs,
          slideshowDefaultIntervalMs: config.slideshowDefaultIntervalMs,
          trashRetentionDays: config.trashRetentionDays,
          aboutHeading: config.aboutHeading,
          aboutText: config.aboutText,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save settings');
      }

      setMessage({ type: 'success', text: 'Settings saved successfully.' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
      {/* Status message */}
      {message && (
        <div
          className={`px-4 py-3 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-success-muted text-success'
              : 'bg-danger-muted text-danger'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Site Title */}
      <div>
        <label htmlFor="siteTitle" className="block text-sm font-medium text-foreground mb-2">
          Site Title
        </label>
        <input
          id="siteTitle"
          type="text"
          value={config.siteTitle}
          onChange={(e) => setConfig({ ...config, siteTitle: e.target.value })}
          className="w-full px-4 py-2.5 rounded-lg bg-surface-hover border border-border text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:border-accent transition-colors"
          placeholder="My Photography"
        />
      </div>

      {/* Site Description */}
      <div>
        <label htmlFor="siteDescription" className="block text-sm font-medium text-foreground mb-2">
          Site Description
        </label>
        <textarea
          id="siteDescription"
          value={config.siteDescription}
          onChange={(e) => setConfig({ ...config, siteDescription: e.target.value })}
          rows={3}
          className="w-full px-4 py-2.5 rounded-lg bg-surface-hover border border-border text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:border-accent transition-colors resize-none"
          placeholder="A photography portfolio"
        />
      </div>

      {/* About Heading */}
      <div>
        <label htmlFor="aboutHeading" className="block text-sm font-medium text-foreground mb-2">
          About Heading
        </label>
        <input
          id="aboutHeading"
          type="text"
          value={config.aboutHeading}
          onChange={(e) => setConfig({ ...config, aboutHeading: e.target.value })}
          className="w-full px-4 py-2.5 rounded-lg bg-surface-hover border border-border text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:border-accent transition-colors"
          placeholder="About the Photographer"
        />
        <p className="text-muted-foreground text-xs mt-1">Heading shown above the bio on the home page.</p>
      </div>

      {/* About Text */}
      <div>
        <label htmlFor="aboutText" className="block text-sm font-medium text-foreground mb-2">
          About Text
        </label>
        <textarea
          id="aboutText"
          value={config.aboutText}
          onChange={(e) => setConfig({ ...config, aboutText: e.target.value })}
          rows={5}
          className="w-full px-4 py-2.5 rounded-lg bg-surface-hover border border-border text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:border-accent transition-colors resize-none"
          placeholder="A short bio about the photographer..."
        />
        <p className="text-muted-foreground text-xs mt-1">Bio paragraph displayed on the home page.</p>
      </div>

      {/* Hero Interval */}
      <div>
        <label htmlFor="heroIntervalMs" className="block text-sm font-medium text-foreground mb-2">
          Hero Carousel Interval (ms)
        </label>
        <input
          id="heroIntervalMs"
          type="number"
          min={1000}
          max={30000}
          step={500}
          value={config.heroIntervalMs}
          onChange={(e) => setConfig({ ...config, heroIntervalMs: parseInt(e.target.value) || 5000 })}
          className="w-full px-4 py-2.5 rounded-lg bg-surface-hover border border-border text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:border-accent transition-colors"
        />
        <p className="text-muted-foreground text-xs mt-1">Time between hero image transitions. 1000ms = 1 second.</p>
      </div>

      {/* Slideshow Interval */}
      <div>
        <label htmlFor="slideshowDefaultIntervalMs" className="block text-sm font-medium text-foreground mb-2">
          Slideshow Default Interval (ms)
        </label>
        <input
          id="slideshowDefaultIntervalMs"
          type="number"
          min={1000}
          max={30000}
          step={500}
          value={config.slideshowDefaultIntervalMs}
          onChange={(e) =>
            setConfig({ ...config, slideshowDefaultIntervalMs: parseInt(e.target.value) || 4000 })
          }
          className="w-full px-4 py-2.5 rounded-lg bg-surface-hover border border-border text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:border-accent transition-colors"
        />
        <p className="text-muted-foreground text-xs mt-1">Default auto-advance time for album slideshows.</p>
      </div>

      {/* Trash Retention */}
      <div>
        <label htmlFor="trashRetentionDays" className="block text-sm font-medium text-foreground mb-2">
          Trash Retention (days)
        </label>
        <input
          id="trashRetentionDays"
          type="number"
          min={1}
          max={365}
          value={config.trashRetentionDays}
          onChange={(e) =>
            setConfig({ ...config, trashRetentionDays: parseInt(e.target.value) || 30 })
          }
          className="w-full px-4 py-2.5 rounded-lg bg-surface-hover border border-border text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:border-accent transition-colors"
        />
        <p className="text-muted-foreground text-xs mt-1">Days before trashed items are permanently deleted.</p>
      </div>

      {/* Save button */}
      <button
        type="submit"
        disabled={saving}
        className="px-6 py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {saving ? 'Saving...' : 'Save Settings'}
      </button>
    </form>
  );
}
