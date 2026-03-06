import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const albums = sqliteTable('albums', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  coverPhotoId: text('cover_photo_id'),
  sortOrder: integer('sort_order').notNull().default(0),
  isHero: integer('is_hero', { mode: 'boolean' }).notNull().default(false),
  isPublic: integer('is_public', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
  deletedAt: integer('deleted_at'),
}, (table) => ([
  uniqueIndex('album_slug_idx').on(table.slug),
  index('album_sort_order_idx').on(table.sortOrder),
  index('album_is_hero_idx').on(table.isHero),
  index('album_is_public_idx').on(table.isPublic),
  index('album_deleted_at_idx').on(table.deletedAt),
]));

export const photos = sqliteTable('photos', {
  id: text('id').primaryKey(),
  albumId: text('album_id').notNull().references(() => albums.id, { onDelete: 'cascade' }),
  filename: text('filename').notNull(),
  originalFilename: text('original_filename').notNull(),
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  mimeType: text('mime_type').notNull(),
  exifJson: text('exif_json'),
  caption: text('caption'),
  sortOrder: integer('sort_order').notNull().default(0),
  storageKey: text('storage_key').notNull(),
  blurhash: text('blurhash').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
  deletedAt: integer('deleted_at'),
  deletedBy: text('deleted_by'),
}, (table) => ([
  index('photo_album_id_idx').on(table.albumId),
  index('photo_sort_order_idx').on(table.albumId, table.sortOrder),
  uniqueIndex('photo_storage_key_idx').on(table.storageKey),
  index('photo_deleted_at_idx').on(table.deletedAt),
]));

export const siteConfig = sqliteTable('site_config', {
  id: integer('id').primaryKey().default(1),
  siteTitle: text('site_title').notNull().default('My Photography'),
  siteDescription: text('site_description').notNull().default('A photography portfolio'),
  heroIntervalMs: integer('hero_interval_ms').notNull().default(5000),
  slideshowDefaultIntervalMs: integer('slideshow_default_interval_ms').notNull().default(4000),
  themeColorPrimary: text('theme_color_primary').notNull().default('#ffffff'),
  themeColorBackground: text('theme_color_background').notNull().default('#0a0a0a'),
  themeColorAccent: text('theme_color_accent').notNull().default('#3b82f6'),
  themeFontHeading: text('theme_font_heading').notNull().default('Inter'),
  themeFontBody: text('theme_font_body').notNull().default('Inter'),
  trashRetentionDays: integer('trash_retention_days').notNull().default(30),
});

export const playlists = sqliteTable('playlists', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  sortOrder: integer('sort_order').default(0),
  isPublic: integer('is_public', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).$defaultFn(() => new Date()),
}, (table) => ([
  uniqueIndex('playlist_slug_idx').on(table.slug),
  index('playlist_sort_order_idx').on(table.sortOrder),
  index('playlist_is_public_idx').on(table.isPublic),
]));

export const playlistPhotos = sqliteTable('playlist_photos', {
  id: text('id').primaryKey(),
  playlistId: text('playlist_id').notNull().references(() => playlists.id, { onDelete: 'cascade' }),
  photoId: text('photo_id').notNull().references(() => photos.id, { onDelete: 'cascade' }),
  sortOrder: integer('sort_order').default(0),
  addedAt: integer('added_at', { mode: 'timestamp_ms' }).$defaultFn(() => new Date()),
}, (table) => ([
  index('playlist_photo_playlist_id_idx').on(table.playlistId),
  index('playlist_photo_sort_order_idx').on(table.playlistId, table.sortOrder),
  index('playlist_photo_photo_id_idx').on(table.photoId),
]));
