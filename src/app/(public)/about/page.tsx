export const dynamic = 'force-dynamic';

import { getSiteConfig } from '@/lib/db/queries/config';
import { getFavoritePhotos } from '@/lib/db/queries/photos';
import { getPhotoUrl } from '@/lib/utils/url';

export default async function AboutPage() {
  const config = await getSiteConfig();
  const aboutHeading = config?.aboutHeading ?? 'About the Photographer';
  const aboutText = config?.aboutText ?? '';

  // Get a favorite photo to use as a feature image
  const favorites = await getFavoritePhotos();
  const featurePhoto = favorites[0];

  return (
    <div className="page-enter">
      {/* Hero-style header with a feature photo */}
      {featurePhoto && (
        <div className="relative h-[50vh] min-h-[400px] overflow-hidden">
          <img
            src={getPhotoUrl(featurePhoto.storageKey, 'display')}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-background)] via-[var(--color-background)]/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16">
            <h1 className="text-3xl md:text-5xl font-light tracking-tight text-[var(--color-foreground)]">
              {aboutHeading}
            </h1>
          </div>
        </div>
      )}

      {/* If no feature photo, just show the heading */}
      {!featurePhoto && (
        <div className="pt-24 pb-8 px-4 md:px-6">
          <h1 className="text-3xl md:text-5xl font-light tracking-tight text-[var(--color-foreground)] text-center">
            {aboutHeading}
          </h1>
        </div>
      )}

      {/* Bio content */}
      <section className="px-4 md:px-6 py-16 mx-auto max-w-3xl">
        <div className="space-y-6 text-center">
          {aboutText.split('\n').filter(p => p.trim()).map((paragraph, i) => (
            <p
              key={i}
              className="text-lg md:text-xl leading-relaxed text-[var(--color-muted)] font-light"
            >
              {paragraph}
            </p>
          ))}
        </div>

        {/* Decorative divider */}
        <div className="my-16 flex items-center justify-center gap-4">
          <div className="h-px w-16 bg-[var(--color-border)]" />
          <div className="h-1 w-1 rounded-full bg-[var(--color-accent)]" />
          <div className="h-px w-16 bg-[var(--color-border)]" />
        </div>

        {/* Contact / CTA section */}
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.15em] text-[var(--color-muted-foreground)] mb-4">
            Get in Touch
          </p>
          <a
            href="mailto:sgtpilot@gmail.com"
            className="text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors text-lg"
          >
            sgtpilot@gmail.com
          </a>
        </div>
      </section>
    </div>
  );
}
