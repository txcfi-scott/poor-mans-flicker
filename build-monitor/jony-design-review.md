# Poor Man's Flickr -- Design Review & Improvement Spec

**Reviewer:** Jony (Head of UX/Design)
**Date:** 2026-03-06
**Scope:** Full UI/UX audit of public portfolio and admin interface

---

## 1. Executive Summary

The bones are solid -- dark theme, photos-first hierarchy, blurhash placeholders, justified photo grid. But the execution sits at "competent developer template" rather than "photographer's gallery." The site needs more breathing room, more typographic refinement, more intentional transitions, and a header that disappears so the photography can speak. The admin is functional but visually disconnected from the public site. What follows are specific, implementable changes that will move this from "works fine" to "walks into a gallery."

---

## 2. Critical Issues (P0)

### P0-1: Header blocks the hero -- the single most important moment is compromised

**Current:** The header is `sticky top-0 z-50` with `bg-[#141416]` and a border. The home page hero uses `-mt-16` to pull behind it, but the header remains opaque. The visitor's first impression is a full-screen photo with a dark bar sitting on top of it.

**Should be:** On the home page, the header must be fully transparent and overlaid on the hero, transitioning to an opaque background on scroll. On all other pages, the current sticky opaque header is fine.

**Implementation:**
- The `Header` component already accepts a `transparent` prop but it is never used. The public layout should pass `transparent={true}` only for the home page, or better: the header itself should detect scroll position.
- For the home page: render the header with `bg-transparent` and `absolute` positioning. Add a scroll listener that adds `bg-[#141416]/90 backdrop-blur-md border-b border-[#2A2A30]` after scrolling past ~100px.
- Add `transition-all duration-300` for the background change.

```tsx
// header.tsx -- add scroll-aware background
const [scrolled, setScrolled] = useState(false);

useEffect(() => {
  if (!transparent) return;
  const handleScroll = () => setScrolled(window.scrollY > 80);
  window.addEventListener('scroll', handleScroll, { passive: true });
  return () => window.removeEventListener('scroll', handleScroll);
}, [transparent]);

const bgClass = transparent
  ? scrolled
    ? 'fixed top-0 left-0 right-0 z-50 bg-[#141416]/90 backdrop-blur-md border-b border-[#2A2A30] transition-all duration-300'
    : 'fixed top-0 left-0 right-0 z-50 bg-transparent transition-all duration-300'
  : 'bg-[#141416] border-b border-[#2A2A30] sticky top-0 z-50';
```

**Why:** The hero is the entire emotional hook. A photographer's website has roughly three seconds to answer "is this for me?" -- an opaque nav bar during that moment is a wall between the visitor and the work.

---

### P0-2: The photo grid gap is too tight -- photos feel crammed

**Current:** `photo-grid.tsx` uses `GAP = 8` (8px between photos). Target row heights are 200/240/280px.

**Should be:** `GAP = 4` for a tighter, more editorial look -- or `GAP = 6` for a slightly more airy feel. But critically, the target row heights need to increase significantly: **260px mobile, 300px tablet, 360px desktop**. Photos should feel generous, not thumbnailed.

**Implementation:**
```tsx
// photo-grid.tsx
const GAP = 4; // tighter gaps, photos nearly touch -- gallery feel

function getTargetHeight(): number {
  if (typeof window === 'undefined') return 300;
  const w = window.innerWidth;
  if (w < 768) return 260;
  if (w < 1024) return 300;
  return 360;
}
```

**Why:** Photography portfolios are about immersion. Small rows with visible gaps create a "contact sheet" feeling instead of a gallery feeling. The photos should be large enough that you can feel them before you click.

---

### P0-3: The slideshow page is a stub

**Current:** `slideshow/page.tsx` renders `<main>Slideshow</main>` -- just the word "Slideshow."

**Should be:** A full-screen, immersive slideshow experience. This is the single most important feature for a photography portfolio visitor who wants to lean back and view the work.

**Implementation:** This needs a proper fullscreen slideshow component. Key behaviors:
- Full viewport, no chrome (no header, no footer)
- Crossfade transitions (reuse hero carousel transition logic)
- Keyboard navigation (arrow keys, Escape to exit)
- Touch swipe on mobile
- Auto-advance with pause on hover/touch
- Photo counter (e.g., "3 / 24") in a subtle overlay at bottom
- Caption display when available
- Close button (X) in top-right corner, returns to album page

This is a significant feature gap and should be prioritized.

---

### P0-4: Inconsistent color system -- hardcoded values vs. design tokens

**Current:** The globals.css defines tokens like `--color-accent: #3b82f6` (standard blue-500), but the actual components use hardcoded `#6B8AFF` everywhere -- a different, more muted periwinkle blue. The design doc specifies `#6B8AFF` as the accent. The CSS tokens and the actual implementation disagree.

**Should be:** One source of truth. Update `globals.css` to match the design doc's color system:

```css
@theme {
  --color-background: #0A0A0B;
  --color-foreground: #F0F0F2;
  --color-muted: #9E9EA8;
  --color-muted-foreground: #636370;
  --color-border: #2A2A30;
  --color-border-hover: #3E3E48;
  --color-accent: #6B8AFF;
  --color-accent-hover: #8BA3FF;
  --color-accent-muted: #6B8AFF1A;
  --color-surface: #141416;
  --color-surface-hover: #1E1E22;
  --color-surface-elevated: #28282E;
  --color-danger: #F87171;
  --color-danger-muted: #F871711A;
  --color-success: #4ADE80;
  --color-success-muted: #4ADE801A;
  --color-warning: #FACC15;
  --color-warning-muted: #FACC151A;
}
```

Then replace all inline `style={{ color: '#6B8AFF' }}` and `bg-[#6B8AFF]` with Tailwind token classes (`text-accent`, `bg-accent`). This is a find-and-replace pass but it is critical for maintainability and consistency.

**Affected files:** Nearly every component file. The login page, home page, album detail, lightbox, all admin components. Approximately 80+ instances of hardcoded hex colors that should reference tokens.

---

## 3. Major Improvements (P1)

### P1-1: Typography needs a hierarchy -- everything looks the same weight

**Current:** All headings use `font-bold` or `font-semibold`. There is no distinction between page titles, section titles, and card titles. The font is Inter throughout, which is fine, but it is used at undifferentiated sizes and weights.

**Should be:** A clear typographic scale:

| Element | Size | Weight | Tracking | Color |
|---------|------|--------|----------|-------|
| Hero title | `text-4xl md:text-5xl lg:text-6xl` | `font-light` | `tracking-tight` | white |
| Page title | `text-3xl md:text-4xl` | `font-light` | `tracking-tight` | foreground |
| Section title | `text-xl md:text-2xl` | `font-medium` | `tracking-tight` | foreground |
| Card title | `text-base` | `font-medium` | normal | foreground |
| Body | `text-base` | `font-normal` | normal | foreground |
| Caption/meta | `text-sm` | `font-normal` | normal | muted |
| Label | `text-xs` | `font-medium` | `tracking-wide uppercase` | muted |

**Key change:** Lighter weights for large text. `font-bold` on a 3xl heading is visually heavy and competes with the photography. A photographer's site should whisper its chrome and let the images shout.

**Specific changes:**
- Home page `h1`: Change from `text-3xl lg:text-5xl font-bold` to `text-4xl md:text-5xl lg:text-6xl font-light tracking-tight`
- Albums page `h1`: Change from `text-3xl font-bold` to `text-3xl md:text-4xl font-light tracking-tight`
- Album detail `h1`: Same treatment
- Featured albums section title: Change from `text-2xl font-semibold` to `text-xs font-medium tracking-[0.2em] uppercase text-muted` (category label style)
- "Browse Albums" CTA: Currently `text-sm font-semibold` -- change to `text-sm font-medium tracking-wide`

---

### P1-2: The hero section text overlay needs refinement

**Current:** Site title and description are bottom-left aligned on desktop, center on mobile. The "Browse Albums" button uses a hardcoded `style={{ backgroundColor: '#6B8AFF' }}`.

**Should be:**
- Position text overlay centered vertically and horizontally -- this is a gallery, not a news site
- Remove the "Browse Albums" button entirely. The scroll indicator chevron is the call-to-action. Let the photography be the invitation.
- If a button must stay, make it ghost/outline style: `border border-white/30 text-white hover:bg-white/10` -- it should not compete with the image
- Remove the `textShadow` inline styles. Instead, use a more refined gradient overlay that naturally creates contrast
- Gradient overlay should be subtle: `linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.3) 100%)` -- dark at bottom for text, slight vignette at top for the header

```tsx
// Refined hero overlay positioning
<div className="absolute inset-0 flex items-center justify-center text-center pointer-events-none">
  <div className="pointer-events-auto px-6">
    <h1 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight text-white">
      {siteTitle}
    </h1>
    <p className="mt-4 text-lg md:text-xl font-normal text-white/70">
      {siteDescription}
    </p>
  </div>
</div>
```

---

### P1-3: Album cards need more presence

**Current:** Album cards are `rounded-lg border border-[#2A2A30] bg-[#141416]` with 4/3 aspect cover images. The text area (`p-4`) with title + description is compact.

**Should be:**
- Remove the border entirely. On a dark background, borderless cards with subtle shadow look more premium: `rounded-xl overflow-hidden bg-[#141416] shadow-lg shadow-black/20`
- Increase aspect ratio to `aspect-[3/2]` -- more cinematic, closer to standard photo proportions
- Remove the photo count badge from the cover image. It adds visual noise. Move it to the text area as subtle metadata.
- Text area: increase padding to `p-5`, add more vertical spacing
- Title hover: instead of changing color to accent, add a subtle underline: `group-hover:underline underline-offset-4 decoration-white/30`

```tsx
<Link
  href={`/albums/${slug}`}
  className="group block overflow-hidden rounded-xl bg-[#141416]"
>
  <div className="relative aspect-[3/2] overflow-hidden">
    {/* ... cover image ... */}
    {/* No badge overlay */}
  </div>
  <div className="p-5">
    <h3 className="text-base font-medium text-[#F0F0F2] group-hover:underline underline-offset-4 decoration-white/30">
      {title}
    </h3>
    {truncatedDescription && (
      <p className="mt-2 text-sm leading-relaxed text-[#9E9EA8]">
        {truncatedDescription}
      </p>
    )}
    <p className="mt-3 text-xs text-[#636370]">
      {photoCount} {photoCount === 1 ? 'photo' : 'photos'}
    </p>
  </div>
</Link>
```

---

### P1-4: Lightbox needs more refinement

**Current:** The lightbox uses `backgroundColor: '#000000cc'` with `backdropFilter: 'blur(8px)'`. Navigation buttons are visible only when not first/last. The image scales in on open.

**Issues:**
1. No swipe gesture support on mobile -- critical for a photo gallery
2. The image has `maxWidth: '90vw'` and `maxHeight: '80vh'` -- should be `max-w-[95vw] max-h-[90vh]` to give more space to the photo
3. Nav buttons disappear at first/last -- should always show but be disabled (opacity 30%), so the layout doesn't shift
4. No loading indicator between images -- when `imageLoaded` is false, nothing visible is shown
5. The close button background `bg-[#0A0A0B99]` competes with the photo

**Changes:**
- Add touch swipe support (simple touch start/end delta detection, no library needed)
- Show nav buttons always, dim when at boundary: `opacity-30 cursor-default` vs full opacity
- Add a subtle spinner or blurhash placeholder while the next image loads
- Close button: `bg-black/40 hover:bg-black/60` -- simpler
- Image container: `max-w-[95vw] max-h-[90vh]` for more breathing room
- Add `will-change-opacity` to the main image for smoother transitions
- Caption area: increase font size to `text-lg` and use `text-white/80` instead of `text-[#9E9EA8]`

---

### P1-5: Footer is too heavy

**Current:** The footer is `h-20 border-t border-[#2A2A30] bg-[#141416]` with site title, copyright, and admin link in a row.

**Should be:** Minimal. A photography portfolio footer should almost disappear:

```tsx
<footer className="py-12 text-center">
  <p className="text-xs text-[#636370] tracking-wide">
    &copy; {year} {siteTitle}
  </p>
</footer>
```

- Remove the background color (let the page background show through)
- Remove the border-top
- Remove the admin link from the public footer (move it to a `/admin` direct URL -- photographers know where to find it; it doesn't belong in the visitor's view)
- Increase vertical padding to `py-12` for more breathing room
- Single centered line with copyright

---

### P1-6: The home page "Albums" section title is generic

**Current:** `<h2 className="text-2xl font-semibold mb-8">Albums</h2>`

**Should be:** Either no title at all (let the album grid speak for itself -- the page structure makes it obvious), or a very subtle label:

```tsx
<p className="text-xs font-medium tracking-[0.2em] uppercase text-[#636370] mb-8">
  Recent Work
</p>
```

Changing "Albums" to "Recent Work" (or "Collections" or "Portfolios") also makes it feel less like a file manager and more like a gallery.

---

### P1-7: Page transitions are abrupt

**Current:** No page transition animations. Clicking between pages is a hard cut.

**Should be:** Subtle fade transitions between pages. This can be achieved with Next.js view transitions or a simple wrapper:

```css
/* globals.css */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.page-enter {
  animation: fadeIn 0.3s ease-out;
}
```

Apply `className="page-enter"` to the `<main>` element in the public layout. This gives a subtle upward fade that feels intentional without calling attention to itself.

---

### P1-8: The album detail page back link is undersized

**Current:** `<Link href="/albums" className="mb-4 inline-flex items-center gap-1 text-sm text-[#9E9EA8]">` with a 16x16 chevron SVG.

**Should be:** A more generous touch target and visual weight:

```tsx
<Link
  href="/albums"
  className="mb-6 inline-flex items-center gap-2 text-sm text-[#636370] hover:text-[#F0F0F2] transition-colors py-2"
>
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.5 15L7.5 10l5-5" />
  </svg>
  All Albums
</Link>
```

- Minimum 44px touch target (add `py-2`)
- Larger icon (20px)
- More margin below (`mb-6`)
- Lighter default color, stronger hover -- the back button should be findable but not dominant

---

## 4. Polish Items (P2)

### P2-1: Add a Ken Burns effect to the hero carousel

**Current:** Static images with crossfade. Good, but static.

**Should be:** Subtle, slow zoom (Ken Burns effect) during each image's display time. Scale from 1.0 to 1.05 over the interval duration. This adds life without being distracting.

```tsx
// hero-carousel.tsx -- on the current image div
<div
  className="absolute inset-0"
  style={{
    animation: `kenBurns ${intervalMs + 1500}ms ease-out forwards`,
  }}
>
```

```css
/* globals.css */
@keyframes kenBurns {
  from { transform: scale(1); }
  to { transform: scale(1.05); }
}
```

---

### P2-2: Album card hover effect is too simple

**Current:** `group-hover:scale-105` on the cover image. Standard zoom.

**Should be:** A more refined combination: slight zoom + brightness increase + shadow lift:

```tsx
<div className="relative aspect-[3/2] overflow-hidden">
  <BlurHashImage
    // ...
    className="object-cover transition-all duration-500 ease-out group-hover:scale-[1.03] group-hover:brightness-110"
  />
</div>
```

Note: `scale-105` (5%) is too much -- `scale-[1.03]` (3%) is subtler. Duration 500ms instead of 300ms for elegance.

---

### P2-3: Photo card caption overlay needs refinement

**Current:** Caption slides up from `translate-y-full` on hover. The gradient is from `#0A0A0BCC` to transparent.

**Should be:** Instead of a sliding overlay, use a persistent subtle gradient at the bottom of every photo, with caption text fading in on hover:

```tsx
{/* Always-present gradient */}
<div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

{/* Caption fades in on hover */}
{caption && (
  <div className="absolute inset-x-0 bottom-0 px-4 pb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
    <p className="text-sm text-white/90 drop-shadow-md">{caption}</p>
  </div>
)}
```

---

### P2-4: The scroll indicator bounce animation is too playful

**Current:** `animate-bounce` on the chevron at the bottom of the hero. This is a high-energy animation that feels more like a game app than a photography portfolio.

**Should be:** A slow, subtle float:

```css
/* globals.css */
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(6px); }
}
```

```tsx
<div className="absolute bottom-8 left-1/2 -translate-x-1/2" style={{ animation: 'float 3s ease-in-out infinite' }}>
  <svg className="h-5 w-5 text-white/40" /* ... */ />
</div>
```

Note: smaller icon (h-5 instead of h-6), less opacity (white/40 instead of white/60), slower animation (3s instead of bounce's 1s), positioned slightly higher (bottom-8 instead of bottom-6).

---

### P2-5: Login page is solid but could be more refined

**Current:** Centered card with inline style hover handlers (`onMouseOver`/`onMouseOut`).

**Changes:**
- Replace inline style handlers with proper Tailwind hover classes: `hover:bg-[#8BA3FF]` (requires using Tailwind token classes after P0-4 fix)
- Remove inline `style={{ backgroundColor: '#0A0A0B' }}` from main -- it should use `bg-background`
- Add a subtle logo or site title above the "Admin Login" heading
- The error message animation: add `animate-shake` for invalid token feedback

---

### P2-6: Empty states need illustration refinement

**Current:** Empty states use inline SVGs (image icon placeholder). The albums empty state has an icon + "No albums yet." The admin photo grid has a similar pattern.

**Should be:** Empty states are design opportunities:
- Larger icon (64px instead of 48px)
- Lighter stroke (strokeWidth 1 instead of 1.5)
- Add a subtle call-to-action where appropriate ("Upload your first photos" with a link in admin)
- Use `opacity-20` on icons instead of a muted color -- this makes them feel more like watermarks

---

### P2-7: Admin dashboard stat cards could be more refined

**Current:** Stat cards use colored numbers with hardcoded colors per stat.

**Should be:**
- All stat values in the same color (foreground white) -- the colored numbers feel like a Christmas tree
- Add subtle background tint per card type instead: `bg-[#6B8AFF08]` for blue, `bg-[#4ADE8008]` for green
- Add a small icon per stat card (camera icon for photos, folder for albums, etc.)
- Value font size: `text-3xl font-light` instead of `text-2xl font-semibold` -- lighter, larger, more elegant

---

### P2-8: The mobile menu needs transition

**Current:** Mobile overlay appears instantly (`{menuOpen && ...}`). No entrance/exit animation.

**Should be:** Fade in the overlay, slide in the navigation items:

```tsx
// Use a state + CSS transition instead of conditional rendering
<div
  className={`fixed inset-0 z-[60] flex flex-col items-center justify-center bg-[#0A0A0B] lg:hidden transition-opacity duration-300 ${
    menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
  }`}
>
```

---

### P2-9: Admin photo edit modal image area

**Current:** `max-h-[50vh]` for the image in the edit modal.

**Should be:** The image should be the hero of this modal. Use `max-h-[60vh]` and add a dark background behind it: `bg-black` on the image container. The rounded corners on the modal should use `rounded-2xl` for a more premium feel.

---

### P2-10: Button consistency across admin

**Current:** Mixed button styles:
- Some use `bg-accent hover:bg-accent-hover` (Tailwind tokens)
- Some use `bg-[#6B8AFF] hover:bg-[#8BA3FF]` (hardcoded)
- Some use `bg-red-600` (Tailwind default red)
- Delete buttons use `text-danger hover:bg-danger/10` (mixed token/utility)

**Should be:** A single button component or at minimum consistent classes:

| Variant | Classes |
|---------|---------|
| Primary | `bg-accent hover:bg-accent-hover text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors` |
| Secondary | `bg-surface-hover border border-border hover:border-border-hover text-foreground rounded-lg px-4 py-2.5 text-sm font-medium transition-colors` |
| Ghost | `text-muted hover:text-foreground hover:bg-surface-hover rounded-lg px-4 py-2.5 text-sm font-medium transition-colors` |
| Danger | `bg-danger-muted text-danger hover:bg-danger/20 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors` |

---

## 5. Component-by-Component Review

### Header (`components/layout/header.tsx`)
- **Good:** Clean, minimal nav. Mobile hamburger menu.
- **Fix:** Implement transparent mode for hero page (P0-1). Desktop nav `gap-8` is too wide for a single "Albums" link -- reduce or add more links (About, Contact if applicable).
- **Fix:** The site title link should use `font-light tracking-tight` instead of `font-bold` -- bold logos compete with photos.

### Footer (`components/layout/footer.tsx`)
- **Fix:** Simplify dramatically per P1-5. Remove admin link.

### HeroCarousel (`components/gallery/hero-carousel.tsx`)
- **Good:** Crossfade logic, preloading, scroll indicator.
- **Fix:** Add Ken Burns (P2-1). Fix scroll indicator animation (P2-4). Refine gradient overlay (P1-2).
- **Fix:** Empty state is just a blank dark div -- add a subtle "No hero photos configured" message for admin users, or a gradient placeholder.

### PhotoGrid (`components/gallery/photo-grid.tsx`)
- **Good:** Justified layout algorithm is well-implemented.
- **Fix:** Increase target heights and reduce gap (P0-2).
- **Fix:** The last row threshold (80%) is good. No change needed.

### PhotoCard (`components/gallery/photo-card.tsx`)
- **Good:** Semantic button element, aria-label, focus-visible ring.
- **Fix:** The `rounded-md border border-[#2A2A30]` gives each photo a visible frame. Remove the border entirely -- photos in a justified grid should feel seamless. Change to `rounded-sm` (2px) or remove rounding entirely for edge-to-edge feel.
- **Fix:** `hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]` is reasonable but remove the hover border change -- it creates a "selecting" feel that conflicts with the click-to-lightbox intent.
- **Fix:** Caption overlay refinement per P2-3.

### AlbumCard (`components/gallery/album-card.tsx`)
- **Fix:** Per P1-3 -- remove border, increase aspect ratio, refine text area, remove photo count badge.

### Lightbox (`components/gallery/lightbox.tsx`)
- **Good:** Fade-in, scale animation, keyboard nav (via hook), preloading.
- **Fix:** Per P1-4 -- add swipe, always-visible nav buttons, loading state, more image space.
- **Fix:** Add body scroll lock (the hook does this, but verify it works on iOS Safari).

### BlurHashImage (`components/gallery/blurhash-image.tsx`)
- **Good:** Canvas-based blurhash decode at 32px, smooth opacity transition.
- **No changes needed.** This is well-implemented.

### Login (`app/login/page.tsx`)
- **Fix:** Replace inline style handlers with Tailwind classes (P2-5).
- **Fix:** Use `bg-background` class instead of inline style.
- **Fix:** The `onFocus`/`onBlur` handlers for border color should be replaced with `focus:border-accent` Tailwind class.

### Error/NotFound pages
- **Good:** Centered layout, clear messaging, action button.
- **Fix:** The 404 page `text-6xl font-bold` for "404" is heavy. Change to `text-8xl font-extralight tracking-tighter text-[#F0F0F2]/20` -- make it a subtle background element, not a shout.
- **Fix:** Add a subtle photographic element to the 404 -- even a CSS-only aperture icon or broken frame icon would be better than just text.

### Admin Sidebar (`components/admin/AdminSidebar.tsx`)
- **Good:** Active state highlighting, mobile slide-out, bottom section with logout.
- **Fix:** The sidebar width `w-60` is fine. Add `overflow-y-auto` to the nav section for many-item scrolling.
- **Fix:** The mobile hamburger button positioning (`fixed top-4 left-4`) may overlap with page content. Add a `pl-16` to the admin layout's main area on mobile to avoid overlap.

### Admin Dashboard (`app/admin/page.tsx`)
- **Fix:** Stat card refinement per P2-7.
- **Fix:** Recent photos list uses `toLocaleDateString()` which varies by locale. Use a consistent format: `new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date)`.

### Admin Album List (`components/admin/AlbumList.tsx` + `AlbumCard.tsx`)
- **Good:** Drag-and-drop reordering with dnd-kit.
- **Fix:** The admin album cards use `bg-surface hover:bg-surface-hover` -- these are Tailwind tokens that now resolve correctly after P0-4 color fix.
- **Fix:** The delete confirmation uses `confirm()` browser dialog. Replace with an inline confirmation pattern (the TrashManager already does this well -- adopt that pattern).

### Admin PhotoGrid (`components/admin/PhotoGrid.tsx` + `PhotoCard.tsx`)
- **Good:** Grid layout with selection, drag-and-drop, overlay actions.
- **Fix:** The hover overlay with 3 action buttons (set cover, edit, delete) is dense. Consider moving these to a context menu (right-click / long-press) to keep the grid clean.
- **Fix:** The checkbox in admin photo cards is always visible -- good for usability. But the styling `bg-black/30` makes it hard to see on dark photos. Add a white ring: `ring-2 ring-white/50`.

### Admin Photo Edit Modal (`components/admin/PhotoEditModal.tsx`)
- **Good:** Focus trap, escape key, body scroll lock, EXIF display.
- **Fix:** Per P2-9 -- more image space, rounded-2xl.
- **Fix:** The EXIF data section uses `text-white/40` and `text-white/70` -- these should use the design tokens (`text-muted-foreground` and `text-muted`).

### Settings Form (`components/admin/SettingsForm.tsx`)
- **Good:** Clean form layout, helper text, success/error messages.
- **Fix:** The "ms" fields are not user-friendly. Add a preview: "5000ms = 5 seconds" or use a seconds input with conversion.
- **Fix:** The form `max-w-2xl` creates an odd layout when the sidebar is present. The admin layout already constrains to `max-w-7xl` -- the form should use `max-w-lg` for better proportion.

### TrashManager (`components/admin/TrashManager.tsx`)
- **Good:** Restore/delete-forever flow, time-ago display, expiry warnings.
- **Fix:** The empty state uses an HTML entity emoji (`&#128465;`) which renders differently across browsers. Replace with an SVG trash icon.
- **Fix:** The trashed photo grid uses `opacity-60` on images -- good visual signal. Keep.

### BulkActions (`components/admin/BulkActions.tsx`)
- **Good:** Fixed bottom bar with count and actions.
- **Fix:** References `animate-slide-up` which is likely not defined. Add to globals.css:

```css
@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
.animate-slide-up {
  animation: slideUp 0.2s ease-out;
}
```

### PhotoUploader (`components/admin/PhotoUploader.tsx`)
- **Good:** Drag-and-drop zone, file queue with progress.
- **Fix:** The drop zone uses `text-text-muted` and `text-text` -- these don't match the theme token names. Should be `text-muted` and `text-foreground`.
- **Fix:** The drop zone could use a dashed border animation on drag-over for better feedback.

---

## 6. Design Tokens Update

### Current tokens (globals.css) -- what to change:

```css
@theme {
  /* Backgrounds */
  --color-background: #0A0A0B;       /* was #0a0a0a -- subtle but intentional cool shift */
  --color-foreground: #F0F0F2;       /* was #fafafa -- slightly less bright, easier on eyes */
  --color-muted: #9E9EA8;            /* was #a1a1aa -- cooler tone */
  --color-muted-foreground: #636370; /* was #71717a -- cooler, darker */
  --color-border: #2A2A30;           /* was #27272a -- aligned with design doc */
  --color-border-hover: #3E3E48;     /* NEW -- needed for hover states */
  --color-accent: #6B8AFF;           /* was #3b82f6 -- the periwinkle used everywhere */
  --color-accent-hover: #8BA3FF;     /* was #2563eb -- lighter for hover */
  --color-accent-muted: #6B8AFF1A;   /* NEW -- 10% opacity for subtle backgrounds */
  --color-surface: #141416;          /* was #141414 -- cool undertone */
  --color-surface-hover: #1E1E22;    /* was #1a1a1a -- aligned with design doc */
  --color-surface-elevated: #28282E; /* NEW -- for dropdowns, tooltips */
  --color-danger: #F87171;           /* was #ef4444 -- softer red */
  --color-danger-muted: #F871711A;   /* NEW */
  --color-success: #4ADE80;          /* was #22c55e -- brighter green */
  --color-success-muted: #4ADE801A;  /* NEW */
  --color-warning: #FACC15;          /* NEW */
  --color-warning-muted: #FACC151A;  /* NEW */
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-heading: 'Inter', system-ui, -apple-system, sans-serif;
}
```

### Typography scale to add:

```css
/* globals.css -- add after body styles */
h1 { font-weight: 300; letter-spacing: -0.025em; }
h2 { font-weight: 500; letter-spacing: -0.02em; }
h3 { font-weight: 500; }
```

---

## 7. Implementation Notes

### Priority order:
1. **P0-4** (color tokens) -- do this first, it unblocks clean implementation of everything else
2. **P0-1** (transparent header on hero) -- biggest visual impact, single component change
3. **P0-2** (photo grid spacing) -- two constant changes, big impact
4. **P0-3** (slideshow) -- significant feature, but scoped to one new component
5. **P1-1 + P1-2** (typography + hero text) -- sweep through templates
6. **P1-3** (album cards) -- single component change
7. **P1-4** (lightbox) -- targeted refinements
8. **P1-5** (footer) -- quick win
9. All P2 items in any order

### CSS additions needed for globals.css:

```css
/* Animations */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes kenBurns {
  from { transform: scale(1); }
  to { transform: scale(1.05); }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(6px); }
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.page-enter {
  animation: fadeIn 0.3s ease-out;
}

.animate-slide-up {
  animation: slideUp 0.2s ease-out;
}

/* Selection color for text */
::selection {
  background-color: var(--color-accent);
  color: white;
}
```

### Key Tailwind class replacements (find-and-replace):

| Current | Replace with |
|---------|-------------|
| `style={{ backgroundColor: '#6B8AFF' }}` | `className="bg-accent"` |
| `style={{ color: '#6B8AFF' }}` | `className="text-accent"` |
| `style={{ color: '#F0F0F2' }}` | `className="text-foreground"` |
| `style={{ color: '#9E9EA8' }}` | `className="text-muted"` |
| `style={{ color: '#636370' }}` | `className="text-muted-foreground"` |
| `bg-[#141416]` | `bg-surface` |
| `bg-[#1E1E22]` | `bg-surface-hover` |
| `bg-[#0A0A0B]` | `bg-background` |
| `border-[#2A2A30]` | `border-border` |
| `border-[#3E3E48]` | `border-border-hover` |
| `text-[#F0F0F2]` | `text-foreground` |
| `text-[#9E9EA8]` | `text-muted` |
| `text-[#636370]` | `text-muted-foreground` |
| `bg-[#6B8AFF]` | `bg-accent` |
| `hover:bg-[#8BA3FF]` | `hover:bg-accent-hover` |
| `text-[#F87171]` | `text-danger` |
| `bg-[#F871711A]` | `bg-danger-muted` |
| `text-[#4ADE80]` | `text-success` |
| `bg-[#4ADE801A]` | `bg-success-muted` |

### Files requiring the most changes (by estimated edit count):

1. `src/app/(public)/page.tsx` -- hero overlay, typography, album section (10+ changes)
2. `src/components/gallery/lightbox.tsx` -- swipe support, nav buttons, loading state (8+ changes)
3. `src/components/gallery/hero-carousel.tsx` -- Ken Burns, gradient, empty state (6+ changes)
4. `src/components/gallery/album-card.tsx` -- border removal, aspect ratio, text area (6+ changes)
5. `src/components/layout/header.tsx` -- scroll-aware transparency (5+ changes)
6. `src/components/layout/footer.tsx` -- complete simplification (rewrite)
7. `src/app/globals.css` -- token updates, animation keyframes (significant additions)
8. All admin components -- color token replacement pass

---

*This is a photographer's gallery. Every pixel either serves the photograph or gets out of the way. There is no third option.*
