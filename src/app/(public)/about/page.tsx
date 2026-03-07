export const dynamic = 'force-dynamic';

import { getSiteConfig } from '@/lib/db/queries/config';

export default async function AboutPage() {
  const config = await getSiteConfig();
  const aboutHeading = config?.aboutHeading ?? 'About the Photographer';
  const aboutText = config?.aboutText ?? '';

  return (
    <section className="px-4 md:px-6 py-24 mx-auto max-w-2xl page-enter">
      <div className="mx-auto mb-8 h-px w-12 bg-[var(--border)]" />

      <h1 className="text-xs font-medium tracking-[0.2em] uppercase text-[var(--text-secondary)] mb-8 text-center">
        {aboutHeading}
      </h1>

      <div className="text-center">
        {aboutText.split('\n').map((paragraph, i) => (
          <p
            key={i}
            className="text-lg leading-relaxed text-[var(--text-secondary)] mb-6 last:mb-0"
          >
            {paragraph}
          </p>
        ))}
      </div>

      <div className="mx-auto mt-8 h-px w-12 bg-[var(--border)]" />
    </section>
  );
}
