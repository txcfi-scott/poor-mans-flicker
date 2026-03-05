import Link from 'next/link';
import { getHeroAlbums, getAlbums } from '@/lib/db/queries/albums';
import { getSiteConfig } from '@/lib/db/queries/config';
import { getPhotoUrl } from '@/lib/utils/url';
import { HeroCarousel } from '@/components/gallery/hero-carousel';
import type { HeroPhoto } from '@/components/gallery/hero-carousel';
import { AlbumCard } from '@/components/gallery/album-card';

export default async function HomePage() {
  const [heroPhotos, config, albumsData] = await Promise.all([
    getHeroAlbums(),
    getSiteConfig(),
    getAlbums(),
  ]);

  const heroInterval = config?.heroIntervalMs ?? 5000;
  const siteTitle = config?.siteTitle ?? 'My Photography';
  const siteDescription = config?.siteDescription ?? 'A photography portfolio';

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
              className="text-3xl lg:text-5xl font-bold text-white"
              style={{ textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}
            >
              {siteTitle}
            </h1>
            <p
              className="mt-2 text-lg lg:text-xl font-normal"
              style={{
                color: '#9E9EA8',
                textShadow: '0 2px 8px rgba(0,0,0,0.6)',
              }}
            >
              {siteDescription}
            </p>
            <div className="mt-8">
              <Link
                href="/albums"
                className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold text-white hover:brightness-110 transition-all active:scale-[0.98]"
                style={{ backgroundColor: '#6B8AFF' }}
              >
                Browse Albums
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Albums Section */}
      {featuredAlbums.length > 0 && (
        <section className="px-4 md:px-6 py-16 mx-auto max-w-7xl">
          <h2
            className="text-2xl font-semibold mb-8"
            style={{ color: '#F0F0F2' }}
          >
            Albums
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
                className="text-sm font-medium transition-colors hover:underline"
                style={{ color: '#6B8AFF' }}
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
