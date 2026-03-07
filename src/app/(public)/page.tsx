export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { getHeroAlbums, getAlbums } from '@/lib/db/queries/albums';
import { getFavoritePhotos } from '@/lib/db/queries/photos';
import { getSiteConfig } from '@/lib/db/queries/config';
import { getPhotoUrl } from '@/lib/utils/url';
import { HeroCarousel } from '@/components/gallery/hero-carousel';
import type { HeroPhoto } from '@/components/gallery/hero-carousel';
import { AlbumCard } from '@/components/gallery/album-card';

export default async function HomePage() {
  const [favoritePhotos, heroAlbumPhotos, config, albumsData] = await Promise.all([
    getFavoritePhotos(),
    getHeroAlbums(),
    getSiteConfig(),
    getAlbums(),
  ]);

  // Use favorites as primary source; fall back to hero albums if none
  const heroPhotos = favoritePhotos.length > 0 ? favoritePhotos : heroAlbumPhotos;

  const heroInterval = config?.heroIntervalMs ?? 5000;
  const siteTitle = config?.siteTitle ?? 'My Photography';
  const siteDescription = config?.siteDescription ?? 'A photography portfolio';
  const aboutHeading = config?.aboutHeading ?? 'About the Photographer';
  const aboutText = config?.aboutText ?? 'Chris Harding is a photographer based in the Pacific Northwest, drawn to landscapes, aviation, and the quiet moments in between. With an eye for natural light and composition, his work celebrates the beauty found in everyday scenes.';

  // Resolve URLs server-side (can't pass functions to client components)
  const heroData: HeroPhoto[] = heroPhotos.map((p) => ({
    displayUrl: getPhotoUrl(p.storageKey, 'display'),
    blurhash: p.blurhash,
    width: p.width,
    height: p.height,
    albumTitle: p.albumTitle,
    albumSlug: p.albumSlug,
  }));

  // Show up to 6 albums on the landing page
  const featuredAlbums = albumsData.slice(0, 6);

  return (
    <main>
      {/* Hero Section — negative margin pulls it behind the sticky header */}
      <section className="relative -mt-16">
        <HeroCarousel photos={heroData} intervalMs={heroInterval} />

        {/* Text overlay */}
        <div className="absolute inset-0 flex items-end pointer-events-none">
          <div className="w-full px-6 pb-24 md:px-8 lg:px-8 pointer-events-auto text-center lg:text-left">
            <h1
              className="text-3xl lg:text-5xl font-light tracking-tight text-white"
              style={{ textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}
            >
              {siteTitle}
            </h1>
            <p
              className="mt-2 text-lg lg:text-xl font-normal text-muted"
              style={{
                textShadow: '0 2px 8px rgba(0,0,0,0.6)',
              }}
            >
              {siteDescription}
            </p>
            <div className="mt-8">
              <Link
                href="/albums"
                className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold border border-white/30 text-white hover:bg-white/10 transition-colors active:scale-[0.98]"
              >
                Browse Albums
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* About / Bio Section */}
      <section className="px-4 md:px-6 py-16 mx-auto max-w-3xl text-center page-enter">
        <div className="mx-auto mb-6 h-px w-12 bg-[var(--border)]" />
        <h2 className="text-xs font-medium tracking-[0.2em] uppercase text-[var(--text-secondary)] mb-6">
          {aboutHeading}
        </h2>
        <p className="text-lg leading-relaxed text-[var(--text-secondary)]">
          {aboutText}
        </p>
        <div className="mx-auto mt-6 h-px w-12 bg-[var(--border)]" />
      </section>

      {/* Featured Albums Section */}
      {featuredAlbums.length > 0 && (
        <section className="px-4 md:px-6 py-16 mx-auto max-w-7xl page-enter">
          <h2 className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground mb-8">
            Recent Work
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {featuredAlbums.map((album) => (
              <AlbumCard
                key={album.id}
                slug={album.slug}
                title={album.title}
                description={album.description}
                photoCount={album.photoCount}
                coverPhotoUrl={album.coverPhotoUrl}
                coverPhotoBlurhash={album.coverPhotoBlurhash}
              />
            ))}
          </div>

          {albumsData.length > 6 && (
            <div className="mt-8 text-center">
              <Link
                href="/albums"
                className="text-sm font-medium text-accent hover:text-accent-hover transition-colors hover:underline"
              >
                View All Albums
              </Link>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
