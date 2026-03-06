import Link from 'next/link';
import { db } from '@/lib/db';
import { albums, photos } from '@/lib/db/schema';
import { count, isNull, isNotNull, sum, desc } from 'drizzle-orm';
import { getStorageProvider } from '@/lib/storage';

export default async function AdminDashboard() {
  // Fetch stats in parallel
  const [albumResult, photoResult, trashAlbumResult, trashPhotoResult, recentPhotos, storageResult] =
    await Promise.all([
      db.select({ count: count() }).from(albums).where(isNull(albums.deletedAt)),
      db.select({ count: count() }).from(photos).where(isNull(photos.deletedAt)),
      db.select({ count: count() }).from(albums).where(isNotNull(albums.deletedAt)),
      db.select({ count: count() }).from(photos).where(isNotNull(photos.deletedAt)),
      db
        .select({
          id: photos.id,
          originalFilename: photos.originalFilename,
          albumId: photos.albumId,
          storageKey: photos.storageKey,
          blurhash: photos.blurhash,
          width: photos.width,
          height: photos.height,
          sizeBytes: photos.sizeBytes,
          createdAt: photos.createdAt,
        })
        .from(photos)
        .where(isNull(photos.deletedAt))
        .orderBy(desc(photos.createdAt))
        .limit(5),
      db.select({ total: sum(photos.sizeBytes) }).from(photos).where(isNull(photos.deletedAt)),
    ]);

  const albumCount = albumResult[0]?.count ?? 0;
  const photoCount = photoResult[0]?.count ?? 0;
  const trashCount = (trashAlbumResult[0]?.count ?? 0) + (trashPhotoResult[0]?.count ?? 0);
  const totalBytes = Number(storageResult[0]?.total ?? 0);

  // Estimate storage: original + 3 variants ~ 2x original
  const estimatedStorage = totalBytes * 2;

  function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
  }

  const storage = getStorageProvider();

  const stats = [
    { label: 'Total Albums', value: albumCount.toString(), color: '#6B8AFF' },
    { label: 'Total Photos', value: photoCount.toString(), color: '#4ADE80' },
    { label: 'In Trash', value: trashCount.toString(), color: '#FACC15' },
    { label: 'Storage (est.)', value: formatBytes(estimatedStorage), color: '#8BA3FF' },
  ];

  return (
    <>
      <h1 className="text-2xl font-semibold text-[#F0F0F2] mb-6">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-[#141416] border border-[#2A2A30] rounded-xl p-5"
          >
            <p className="text-[#9E9EA8] text-sm mb-1">{stat.label}</p>
            <p className="text-2xl font-semibold" style={{ color: stat.color }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Link
          href="/admin/albums/new"
          className="bg-[#141416] border border-[#2A2A30] rounded-xl p-5 hover:border-[#6B8AFF] transition-colors group"
        >
          <div className="flex items-center gap-3">
            <span className="text-[#6B8AFF] text-xl">+</span>
            <div>
              <p className="text-[#F0F0F2] font-medium group-hover:text-[#6B8AFF] transition-colors">
                New Album
              </p>
              <p className="text-[#636370] text-sm">Create a new photo album</p>
            </div>
          </div>
        </Link>
        <Link
          href="/admin/albums"
          className="bg-[#141416] border border-[#2A2A30] rounded-xl p-5 hover:border-[#6B8AFF] transition-colors group"
        >
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-[#6B8AFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
            </svg>
            <div>
              <p className="text-[#F0F0F2] font-medium group-hover:text-[#6B8AFF] transition-colors">
                Manage Albums
              </p>
              <p className="text-[#636370] text-sm">Edit, reorder, and organize</p>
            </div>
          </div>
        </Link>
        <Link
          href="/"
          target="_blank"
          className="bg-[#141416] border border-[#2A2A30] rounded-xl p-5 hover:border-[#6B8AFF] transition-colors group"
        >
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-[#6B8AFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
            <div>
              <p className="text-[#F0F0F2] font-medium group-hover:text-[#6B8AFF] transition-colors">
                View Site
              </p>
              <p className="text-[#636370] text-sm">Open the public site</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent photos */}
      <div className="bg-[#141416] border border-[#2A2A30] rounded-xl p-5">
        <h2 className="text-lg font-semibold text-[#F0F0F2] mb-4">Recent Photos</h2>
        {recentPhotos.length === 0 ? (
          <p className="text-[#636370] text-sm">No photos uploaded yet.</p>
        ) : (
          <div className="space-y-3">
            {recentPhotos.map((photo) => (
              <div
                key={photo.id}
                className="flex items-center gap-4 p-3 rounded-lg bg-[#1E1E22]"
              >
                {/* Thumbnail */}
                <div className="w-12 h-12 rounded-md overflow-hidden bg-[#28282E] shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={storage.getUrl(`${photo.storageKey}/thumb.webp`)}
                    alt={photo.originalFilename}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[#F0F0F2] text-sm truncate">{photo.originalFilename}</p>
                  <p className="text-[#636370] text-xs">
                    {photo.width} x {photo.height} &middot; {formatBytes(photo.sizeBytes)}
                  </p>
                </div>
                <p className="text-[#636370] text-xs shrink-0">
                  {photo.createdAt instanceof Date
                    ? photo.createdAt.toLocaleDateString()
                    : new Date(photo.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
