# Poor Man's Flickr -- UI Design Document

Version 1.0 | March 2026

---

## Table of Contents

1. [Design System](#1-design-system)
2. [Layout System](#2-layout-system)
3. [Public Pages](#3-public-pages)
4. [Admin Pages](#4-admin-pages)
5. [Component Specifications](#5-component-specifications)
6. [Interaction Design](#6-interaction-design)
7. [Responsive Strategy](#7-responsive-strategy)
8. [Accessibility](#8-accessibility)
9. [Loading States and Empty States](#9-loading-states-and-empty-states)

---

## 1. Design System

### 1.1 Color Palette

A dark theme that recedes behind photography. Neutral, cool-toned backgrounds ensure photos are always the brightest element on screen.

```
Token                  Value        Usage
-----                  -----        -----
--bg-primary           #0A0A0B      Page background, modals
--bg-secondary         #141416      Cards, panels, sidebar
--bg-tertiary          #1E1E22      Input fields, hover states
--bg-elevated          #28282E      Dropdown menus, tooltips

--text-primary         #F0F0F2      Headings, body text
--text-secondary       #9E9EA8      Captions, metadata, placeholders
--text-tertiary        #636370      Disabled text, subtle labels

--border-default       #2A2A30      Card borders, dividers
--border-hover         #3E3E48      Input focus rings, hover borders
--border-focus         #6B8AFF      Keyboard focus indicators

--accent-primary       #6B8AFF      Primary buttons, active nav links
--accent-primary-hover #8BA3FF      Button hover state
--accent-primary-muted #6B8AFF1A    Subtle highlight backgrounds (10% opacity)

--accent-danger        #FF6B6B      Delete buttons, error states
--accent-danger-hover  #FF8A8A      Danger hover
--accent-success       #4ADE80      Upload complete, success toast
--accent-warning       #FBBF24      Warnings, caution indicators

--overlay-scrim        #0A0A0BCC    Lightbox/slideshow backdrop (80% opacity)
--overlay-gradient     linear-gradient(transparent, #0A0A0BCC)
                                    Hero text readability gradient
```

### 1.2 Typography

Font stack prioritizes clean, geometric sans-serifs that do not compete with imagery.

```
Token               Family                              Fallback
-----               ------                              --------
--font-display      "Inter", sans-serif                 system-ui
--font-body         "Inter", sans-serif                 system-ui
--font-mono         "JetBrains Mono", monospace         ui-monospace

Scale (rem / px at 16px base):
-------------------------------
--text-xs           0.75rem / 12px       line-height 1rem      letter-spacing 0.02em
--text-sm           0.875rem / 14px      line-height 1.25rem   letter-spacing 0.01em
--text-base         1rem / 16px          line-height 1.5rem    letter-spacing 0
--text-lg           1.125rem / 18px      line-height 1.75rem   letter-spacing 0
--text-xl           1.25rem / 20px       line-height 1.75rem   letter-spacing -0.01em
--text-2xl          1.5rem / 24px        line-height 2rem      letter-spacing -0.02em
--text-3xl          1.875rem / 30px      line-height 2.25rem   letter-spacing -0.02em
--text-4xl          2.25rem / 36px       line-height 2.5rem    letter-spacing -0.03em
--text-5xl          3rem / 48px          line-height 1.1        letter-spacing -0.03em

Font weights:
--font-normal       400     Body text
--font-medium       500     Labels, nav items
--font-semibold     600     Subheadings, buttons
--font-bold         700     Page titles, hero text
```

### 1.3 Spacing Scale

Based on a 4px grid. All spacing uses multiples of 4.

```
Token       Value      Tailwind
-----       -----      --------
--space-0   0px        p-0
--space-1   4px        p-1
--space-2   8px        p-2
--space-3   12px       p-3
--space-4   16px       p-4
--space-5   20px       p-5
--space-6   24px       p-6
--space-8   32px       p-8
--space-10  40px       p-10
--space-12  48px       p-12
--space-16  64px       p-16
--space-20  80px       p-20
--space-24  96px       p-24
```

### 1.4 Border Radius and Shadows

```
Radius:
--radius-sm         4px        Small chips, tags
--radius-md         8px        Cards, inputs, buttons
--radius-lg         12px       Modals, panels
--radius-xl         16px       Large feature cards
--radius-full       9999px     Avatars, pills

Shadows (subtle -- dark themes need softer shadows):
--shadow-sm         0 1px 2px rgba(0,0,0,0.3)
--shadow-md         0 4px 12px rgba(0,0,0,0.4)
--shadow-lg         0 8px 24px rgba(0,0,0,0.5)
--shadow-xl         0 16px 48px rgba(0,0,0,0.6)
```

### 1.5 Component Tokens

#### Buttons

```
Primary Button:
  bg:           var(--accent-primary)
  text:         #FFFFFF
  padding:      12px 24px
  radius:       var(--radius-md)
  font:         --text-sm, --font-semibold
  height:       40px
  hover:        var(--accent-primary-hover)
  active:       scale(0.98)
  disabled:     opacity 0.4, cursor not-allowed
  focus:        2px solid var(--border-focus), 2px offset

Secondary Button (ghost):
  bg:           transparent
  border:       1px solid var(--border-default)
  text:         var(--text-primary)
  padding:      12px 24px
  radius:       var(--radius-md)
  hover:        bg var(--bg-tertiary)
  active:       scale(0.98)

Danger Button:
  bg:           var(--accent-danger)
  text:         #FFFFFF
  hover:        var(--accent-danger-hover)

Icon Button:
  size:         40px x 40px (touch target)
  icon size:    20px
  bg:           transparent
  hover:        bg var(--bg-tertiary)
  radius:       var(--radius-md)
```

#### Inputs

```
Text Input:
  bg:           var(--bg-tertiary)
  border:       1px solid var(--border-default)
  text:         var(--text-primary)
  placeholder:  var(--text-tertiary)
  padding:      10px 14px
  radius:       var(--radius-md)
  height:       40px
  font:         --text-sm
  focus:        border-color var(--border-focus), ring 2px var(--accent-primary-muted)
  error:        border-color var(--accent-danger)

Textarea:
  Same as text input, min-height 80px, resize vertical

Select:
  Same as text input, with chevron icon right-aligned

Slider:
  Track height:  4px, bg var(--bg-tertiary), radius var(--radius-full)
  Filled track:  bg var(--accent-primary)
  Thumb:         16px circle, bg white, shadow var(--shadow-sm)
  Thumb hover:   18px, shadow var(--shadow-md)
```

#### Cards

```
Album Card:
  bg:           var(--bg-secondary)
  border:       1px solid var(--border-default)
  radius:       var(--radius-lg)
  overflow:     hidden (clips cover photo)
  hover:        border-color var(--border-hover), shadow var(--shadow-md), translateY(-2px)
  transition:   all 200ms ease-out
```

### 1.6 Responsive Breakpoints

```
Token       Min-width   Tailwind prefix   Description
-----       ---------   ----------------  -----------
mobile      0px         (default)         Phones portrait
sm          640px       sm:               Phones landscape
md          768px       md:               Tablets portrait
lg          1024px      lg:               Tablets landscape / small desktop
xl          1280px      xl:               Desktop
2xl         1536px      2xl:              Large desktop
```

### 1.7 Animation and Transition Standards

```
Durations:
--duration-fast      100ms      Button active press
--duration-normal    200ms      Hover effects, small transitions
--duration-slow      300ms      Panel open/close, modal appear
--duration-slower    500ms      Page transitions
--duration-crossfade 1500ms     Hero image crossfade

Easing:
--ease-out           cubic-bezier(0.16, 1, 0.3, 1)      Most UI transitions
--ease-in-out        cubic-bezier(0.45, 0, 0.55, 1)     Symmetric transitions
--ease-spring        cubic-bezier(0.34, 1.56, 0.64, 1)  Playful micro-interactions

Rules:
- All interactive elements must have transition on hover/focus states
- Hero crossfade uses CSS opacity transition at --duration-crossfade
- Slideshow transitions default to crossfade; optionally support slide-left
- prefers-reduced-motion: disable all transforms, reduce durations to 0ms,
  crossfade to instant swap
```

---

## 2. Layout System

### 2.1 Page Shell

```
+---------------------------------------------------------------+
|  [Header / Nav Bar]                          height: 64px      |
+---------------------------------------------------------------+
|                                                                 |
|  [Main Content Area]                         flex: 1            |
|  min-height: calc(100vh - 64px - 80px)                         |
|                                                                 |
+---------------------------------------------------------------+
|  [Footer]                                    height: 80px      |
+---------------------------------------------------------------+
```

The page shell uses a flex column layout with `min-h-screen` to ensure the footer sticks to the bottom even on short-content pages.

### 2.2 Public Navigation

Minimal top nav. Photography sites should not distract from the photos.

```
+---------------------------------------------------------------+
|  SiteTitle          Albums   Slideshow              [=] Menu   |
+---------------------------------------------------------------+

Desktop (lg+):
- Left: Site title as text link, --text-lg --font-bold
- Center/Right: Text links: "Albums", "Slideshow"
- No hamburger menu at desktop

Mobile (<lg):
- Left: Site title (truncated if needed)
- Right: Hamburger icon button (24px icon)
- Tap opens a full-screen overlay menu on --bg-primary
  with links stacked vertically, centered, --text-2xl
  Close button top-right
```

### 2.3 Admin Navigation

Sidebar navigation on desktop, bottom bar on mobile.

```
Desktop (lg+):
+----------+----------------------------------------------+
|          |                                              |
|  ADMIN   |                                              |
|  NAV     |           Main Content                       |
|          |                                              |
| Dashboard|                                              |
| Albums   |                                              |
| Settings |                                              |
|          |                                              |
| -------- |                                              |
| View Site|                                              |
| Sign Out |                                              |
|          |                                              |
+----------+----------------------------------------------+
  240px wide     flex: 1

Sidebar:
  bg:             var(--bg-secondary)
  border-right:   1px solid var(--border-default)
  padding:        var(--space-6) var(--space-4)
  position:       fixed, left 0, top 0, bottom 0

Nav items:
  height:         40px
  padding:        0 var(--space-3)
  radius:         var(--radius-md)
  font:           --text-sm, --font-medium
  icon:           20px, left-aligned, var(--text-secondary)
  text:           var(--text-secondary)
  active:         bg var(--accent-primary-muted), text var(--accent-primary), icon var(--accent-primary)
  hover:          bg var(--bg-tertiary)

Mobile (<lg):
+---------------------------------------------------------------+
|  [< Back]     Admin: Albums                     [View Site]    |
+---------------------------------------------------------------+
|                                                                 |
|                    Main Content                                 |
|                                                                 |
+---------------------------------------------------------------+
|  [Dashboard]    [Albums]     [Settings]                        |
+---------------------------------------------------------------+

Bottom bar:
  height:         64px + safe-area-inset-bottom
  bg:             var(--bg-secondary)
  border-top:     1px solid var(--border-default)
  Items centered with icon (20px) above label (--text-xs)
```

### 2.4 Grid System

Using CSS Grid for photo layouts, Tailwind grid utilities for structural layouts.

```
Container widths (max-width, centered with auto margins):
  mobile:     100% with 16px horizontal padding
  sm:         100% with 16px padding
  md:         100% with 24px padding
  lg:         960px
  xl:         1152px
  2xl:        1280px

Photo grid columns:
  mobile:     2 columns
  sm:         2 columns
  md:         3 columns
  lg:         4 columns
  xl:         5 columns
  2xl:        6 columns

  Gap:        var(--space-2) = 8px at all sizes

Album card grid columns:
  mobile:     1 column
  sm:         2 columns
  md:         2 columns
  lg:         3 columns
  xl:         4 columns

  Gap:        var(--space-4) = 16px mobile, var(--space-6) = 24px desktop
```

### 2.5 Photo Grid Layout -- Justified/Masonry

The photo grid uses a **justified row** algorithm (similar to Flickr's layout) to respect aspect ratios:

1. Set a target row height (200px mobile, 240px md, 280px lg+).
2. Pack photos left-to-right, scaling each to the target row height.
3. When a row exceeds container width, shrink all photos in that row proportionally to exactly fit.
4. Last row left-aligned (not stretched) unless it fills > 80% of the width.

This ensures no cropping and respects each photo's natural aspect ratio.

---

## 3. Public Pages

### 3.1 Landing Page (/)

The landing page is a full-bleed hero followed by an album grid. It sets the tone: dramatic, minimal, photo-first.

```
+---------------------------------------------------------------+
|  SiteTitle                    Albums   Slideshow               |
+===============================================================+
|                                                                 |
|                                                                 |
|                   [ HERO IMAGE - full viewport ]                |
|                      crossfading every 6s                       |
|                                                                 |
|           "Photographer Name"                                   |
|           "Tagline or site description"                         |
|                                                                 |
|           [ Browse Albums ]  (primary button)                   |
|                                                                 |
|                                                                 |
+---------------------------------------------------------------+
|                                                                 |
|  Albums                                                         |
|                                                                 |
|  +-------------+  +-------------+  +-------------+             |
|  |             |  |             |  |             |             |
|  | cover photo |  | cover photo |  | cover photo |             |
|  |             |  |             |  |             |             |
|  +-------------+  +-------------+  +-------------+             |
|  | Album Title |  | Album Title |  | Album Title |             |
|  | 24 photos   |  | 12 photos   |  | 8 photos    |             |
|  +-------------+  +-------------+  +-------------+             |
|                                                                 |
|  +-------------+  +-------------+  +-------------+             |
|  |             |  |             |  |             |             |
|  | cover photo |  | cover photo |  | cover photo |             |
|  |             |  |             |  |             |             |
|  +-------------+  +-------------+  +-------------+             |
|  | Album Title |  | Album Title |  | Album Title |             |
|  | 6 photos    |  | 18 photos   |  | 31 photos   |             |
|  +-------------+  +-------------+  +-------------+             |
|                                                                 |
+---------------------------------------------------------------+
|  Footer: site title  |  (c) 2026  |  "Powered by PMF"         |
+---------------------------------------------------------------+
```

**Hero Section Details:**

- Height: `100vh` on first visit (full viewport). Scroll indicator (chevron-down icon, pulsing) at bottom center.
- Background: `<img>` elements absolutely positioned, stacked via z-index. Only two images in DOM at any time (current and next).
- Crossfade: next image fades in via `opacity 0 -> 1` over 1500ms. After transition, previous image is removed from DOM.
- Cycle interval: configurable in admin (default 6 seconds).
- Gradient overlay at bottom 40% of hero: `var(--overlay-gradient)` to ensure text readability.
- Title: `--text-5xl` on desktop, `--text-3xl` on mobile. `--font-bold`. White text with `text-shadow: 0 2px 8px rgba(0,0,0,0.6)`.
- Subtitle: `--text-xl` on desktop, `--text-lg` on mobile. `--font-normal`. `var(--text-secondary)` with same text shadow.
- CTA button: Primary button style, positioned below subtitle with `--space-8` margin-top.
- Text group: positioned absolute, bottom `--space-24`, left `--space-8` (left-aligned) on desktop. Centered on mobile.

**Album Grid Section:**

- Section heading "Albums" in `--text-2xl --font-semibold`, with `--space-16` top padding and `--space-8` bottom margin.
- Grid of AlbumCard components (see Component Specifications).
- Max 6 albums shown on landing page. If more exist, show "View All Albums" link below grid.

**Footer:**

- Height: 80px. `var(--bg-secondary)`. `border-top: 1px solid var(--border-default)`.
- Three columns: site title left, copyright center, "Powered by PMF" right.
- All text `--text-sm var(--text-tertiary)`.
- On mobile: stack vertically, centered, `--space-2` gap.

### 3.2 Albums Index (/albums)

```
+---------------------------------------------------------------+
|  SiteTitle                    Albums   Slideshow               |
+---------------------------------------------------------------+
|                                                                 |
|  Albums                                            [Slideshow] |
|  X albums                                          All Albums  |
|                                                                 |
|  +-------------+  +-------------+  +-------------+             |
|  |             |  |             |  |             |             |
|  | cover photo |  | cover photo |  | cover photo |             |
|  |   280px h   |  |   280px h   |  |   280px h   |             |
|  |             |  |             |  |             |             |
|  +- - - - - - -+  +- - - - - - -+  +- - - - - - -+             |
|  | Album Title |  | Album Title |  | Album Title |             |
|  | 24 photos   |  | 12 photos   |  | 8 photos    |             |
|  +-------------+  +-------------+  +-------------+             |
|                                                                 |
|  ... (all albums shown, same grid)                              |
|                                                                 |
+---------------------------------------------------------------+
|  Footer                                                        |
+---------------------------------------------------------------+
```

**Details:**

- Page heading: "Albums" in `--text-3xl --font-bold`, with subtitle "X albums" in `--text-base var(--text-secondary)`.
- "Slideshow All Albums" link: Secondary button, top-right of heading area. Launches playlist mode with all albums.
- Grid: AlbumCard components in standard album grid (1/2/2/3/4 columns per breakpoint).
- No pagination v1 -- all albums render (expected count < 50).

### 3.3 Album Detail (/albums/[slug])

```
+---------------------------------------------------------------+
|  SiteTitle                    Albums   Slideshow               |
+---------------------------------------------------------------+
|                                                                 |
|  [< Albums]                                                     |
|                                                                 |
|  Album Title                                                    |
|  Description text goes here, one or two lines max.              |
|  24 photos                              [ Start Slideshow ]    |
|                                                                 |
+---------------------------------------------------------------+
|                                                                 |
|  +------+ +----------+ +----+ +------------+ +------+         |
|  |      | |          | |    | |            | |      |         |
|  | img  | |   img    | |img | |    img     | | img  |         |
|  | 3:2  | |   16:9   | |1:1 | |   2:3     | | 4:3  |         |
|  |      | |          | |    | |            | |      |         |
|  +------+ +----------+ +----+ +------------+ +------+         |
|  +----------+ +------+ +------+ +----------+                   |
|  |          | |      | |      | |          |                   |
|  |   img    | | img  | | img  | |   img    |                   |
|  |   16:9   | | 3:2  | | 1:1 | |   4:3    |                   |
|  |          | |      | |      | |          |                   |
|  +----------+ +------+ +------+ +----------+                   |
|                                                                 |
|  ... (justified rows continue)                                  |
|                                                                 |
+---------------------------------------------------------------+
|  Footer                                                        |
+---------------------------------------------------------------+
```

**Album Header:**

- Back link: "< Albums" in `--text-sm var(--text-secondary)`, links to /albums. Margin-bottom `--space-4`.
- Title: `--text-3xl --font-bold`. Margin-bottom `--space-2`.
- Description: `--text-base var(--text-secondary)`. Max 2 lines, truncated with ellipsis. Margin-bottom `--space-2`.
- Photo count: `--text-sm var(--text-tertiary)`.
- "Start Slideshow" button: Primary button, right-aligned on same line as photo count (flex row, space-between). On mobile, full-width below the metadata.

**Photo Grid:**

- Uses the justified row layout described in Section 2.5.
- Each photo is a clickable PhotoCard component.
- Click opens Lightbox.

**Lightbox Overlay:**

```
+---------------------------------------------------------------+
|                                                  [X] Close     |
|                                                                 |
|                                                                 |
|       [<]         +---------------------+         [>]          |
|                   |                     |                       |
|                   |                     |                       |
|                   |    Full-size        |                       |
|                   |    photo            |                       |
|                   |    (object-contain) |                       |
|                   |                     |                       |
|                   |                     |                       |
|                   +---------------------+                       |
|                                                                 |
|                   "Photo caption text"                          |
|                   3 / 24                                        |
|                                                                 |
+---------------------------------------------------------------+
```

- Backdrop: `var(--overlay-scrim)` with `backdrop-filter: blur(8px)`.
- Photo: `object-fit: contain`, max 90% viewport width, max 80% viewport height.
- Close button: top-right, `--space-4` from edges. Icon button with X icon. 40x40px touch target.
- Prev/Next arrows: vertically centered, `--space-4` from left/right edges. Icon buttons, 48x48px. Semi-transparent background `var(--bg-primary)` at 60% opacity. Hidden on first/last photo respectively.
- Caption: below photo, centered, `--text-base var(--text-secondary)`.
- Counter: below caption, centered, `--text-sm var(--text-tertiary)`. Format: "3 / 24".
- Keyboard: Left arrow = previous, Right arrow = next, Escape = close.
- Mobile: swipe left/right to navigate. Tap photo center to toggle UI visibility.
- Transition between photos: horizontal slide (200ms, ease-out).
- Entrance animation: fade in backdrop (200ms), scale photo from 0.95 to 1.0 (300ms, ease-out).

### 3.4 Slideshow

#### Single Album: /slideshow/[slug]
#### Playlist Mode: /slideshow?albums=slug1,slug2,slug3

```
+---------------------------------------------------------------+
|  Album Title                                        3 / 24    |
|                                                                 |
|                                                                 |
|                                                                 |
|                                                                 |
|               +-------------------------+                       |
|               |                         |                       |
|               |                         |                       |
|               |     Full-screen         |                       |
|               |     photo               |                       |
|               |                         |                       |
|               |                         |                       |
|               +-------------------------+                       |
|                                                                 |
|                                                                 |
|                                                                 |
|                                                                 |
|  "Caption text for this photo"                                  |
+---------------------------------------------------------------+
|  [<<] [<]  [Pause]  [>] [>>]    Speed: [====o---]    [X] Exit |
+---------------------------------------------------------------+

Playlist mode adds a bottom bar above controls:
+---------------------------------------------------------------+
| Now: Summer 2024 (12/24)  |  Next: Autumn Hikes  |  5 albums  |
+---------------------------------------------------------------+
```

**Fullscreen Layout:**

- True fullscreen (Fullscreen API on browsers that support it, otherwise fills viewport).
- Background: `var(--bg-primary)` solid black.
- Photo: centered, `object-fit: contain`, fills available space minus control bar.
- Controls auto-hide after 3 seconds of inactivity. Mouse movement or touch reveals them. Cursor also hides.

**Top Bar (auto-hides):**

- Left: Album title, `--text-sm --font-medium var(--text-secondary)`.
- Right: Photo counter "3 / 24", `--text-sm var(--text-tertiary)`.
- Background: `linear-gradient(var(--overlay-scrim), transparent)`, height 80px.
- Fade-in: 200ms.

**Bottom Controls (auto-hides):**

- Background: `linear-gradient(transparent, var(--overlay-scrim))`, height 100px.
- Control bar: centered row of icon buttons, `--space-3` gap.
  - `[<<]` Skip to previous album (playlist mode only), 40px
  - `[<]` Previous photo, 40px
  - `[Play/Pause]` Toggle auto-advance, 48px (larger, primary action)
  - `[>]` Next photo, 40px
  - `[>>]` Skip to next album (playlist mode only), 40px
  - Speed slider: labeled "Speed", range 2s to 15s, default 5s. Width 120px.
  - `[X]` Exit slideshow, 40px.
- All controls: white icons, `opacity: 0.8`, hover `opacity: 1`.

**Caption (auto-hides):**

- Positioned bottom, above control bar, centered.
- `--text-base var(--text-secondary)`. Max 2 lines.
- Text shadow for readability over photos.

**Playlist Bar (playlist mode only, auto-hides with controls):**

- Height: 48px. `var(--bg-secondary)` at 90% opacity.
- Left: "Now: Album Name (12/24)" in `--text-sm`.
- Center divider.
- Center: "Next: Album Name" in `--text-sm var(--text-tertiary)`.
- Right: "5 albums" total count.

**Transitions between photos:**

- Default: crossfade, 800ms.
- Between albums (playlist mode): brief fade-to-black (300ms out, album title card for 1500ms, 300ms in).

**Album Title Card (playlist mode, between albums):**

```
+---------------------------------------------------------------+
|                                                                 |
|                                                                 |
|                                                                 |
|                       Album Title                               |
|                       24 photos                                 |
|                                                                 |
|                                                                 |
|                                                                 |
+---------------------------------------------------------------+
```

- Centered text on black background.
- Title: `--text-4xl --font-bold`, white.
- Count: `--text-lg var(--text-secondary)`.
- Appears for 1500ms, then crossfades into first photo of next album.

**Keyboard Controls:**

```
Space         Play/Pause
Left Arrow    Previous photo
Right Arrow   Next photo
Escape        Exit slideshow
F             Toggle fullscreen
Up Arrow      Increase speed (decrease interval by 1s, min 2s)
Down Arrow    Decrease speed (increase interval by 1s, max 15s)
```

**Touch Controls:**

- Tap center: toggle controls visibility
- Swipe left: next photo
- Swipe right: previous photo
- Swipe down: exit slideshow

---

## 4. Admin Pages

### 4.1 Admin Dashboard (/admin)

```
+----------+----------------------------------------------+
|          |                                              |
|  ADMIN   |  Dashboard                                   |
|          |                                              |
| Dashboard|  +----------+ +----------+ +----------+     |
| Albums   |  | Albums   | | Photos   | | Storage  |     |
| Settings |  |    12    | |   347    | |  2.4 GB  |     |
|          |  +----------+ +----------+ +----------+     |
| -------- |                                              |
| View Site|  Albums                    [ + New Album ]   |
| Sign Out |                                              |
|          |  +---+---------------------+-------+------+  |
|          |  | = | [cover] Album Title | 24 ph | ...  |  |
|          |  +---+---------------------+-------+------+  |
|          |  | = | [cover] Album Title | 12 ph | ...  |  |
|          |  +---+---------------------+-------+------+  |
|          |  | = | [cover] Album Title | 8 ph  | ...  |  |
|          |  +---+---------------------+-------+------+  |
|          |  | = | [cover] Album Title | 31 ph | ...  |  |
|          |  +---+---------------------+-------+------+  |
|          |                                              |
|          |  (drag rows to reorder albums)               |
|          |                                              |
+----------+----------------------------------------------+
```

**Stats Cards:**

- Row of 3 cards at top, equal width, `--space-4` gap.
- Each card: `var(--bg-secondary)`, `var(--border-default)` border, `var(--radius-lg)` radius.
- Label: `--text-sm var(--text-secondary)`, above value.
- Value: `--text-3xl --font-bold var(--text-primary)`.
- Padding: `--space-6`.

**Album List:**

- Section heading "Albums" with `[ + New Album ]` primary button, right-aligned.
- List displayed as rows (not cards) for easy scanning and reordering.
- Each row: 56px height, `var(--bg-secondary)` background, `var(--border-default)` bottom border.
  - Drag handle: 6-dot grid icon, `var(--text-tertiary)`, 20px. Cursor: grab.
  - Cover thumbnail: 40x40px, `var(--radius-sm)`, `object-fit: cover`.
  - Album title: `--text-sm --font-medium`, links to /admin/albums/[slug].
  - Photo count: `--text-sm var(--text-tertiary)`.
  - Overflow menu (...): icon button, opens dropdown with: Edit, View on Site, Delete.
- Rows are draggable (drag handle or entire row). Visual feedback: dragged row gets `var(--shadow-lg)`, elevated z-index, slight opacity reduction on original position.
- Drop indicator: 2px solid `var(--accent-primary)` line between rows.

**Mobile Layout (<lg):**

- Stats cards stack to 1 column on mobile, 3 column on md+.
- Album list full-width, same row structure but tighter.
- Sidebar replaced by bottom nav bar.

### 4.2 Album Management (/admin/albums/[slug])

This is the most complex admin page. It handles upload, reorder, metadata editing, and bulk operations.

```
+----------+----------------------------------------------+
|          |                                              |
|  ADMIN   |  [< Albums]                                  |
|          |                                              |
| Dashboard|  Summer Vacation 2024             [Save]     |
| Albums   |                                              |
| Settings |  +------------------------------------------+|
|          |  | Album Details               [Collapse ^] ||
| -------- |  |                                          ||
| View Site|  | Title:  [Summer Vacation 2024         ]  ||
| Sign Out |  | Slug:   [summer-vacation-2024          ]  ||
|          |  | Desc:   [Our trip to the coast...      ]  ||
|          |  |         [                              ]  ||
|          |  | [x] Include in hero rotation              ||
|          |  |                                          ||
|          |  +------------------------------------------+|
|          |                                              |
|          |  +------------------------------------------+|
|          |  |                                          ||
|          |  |     Drag & drop photos here              ||
|          |  |     or click to browse                   ||
|          |  |                                          ||
|          |  |     [ Browse Files ]                     ||
|          |  |                                          ||
|          |  |     Accepts JPG, PNG, WebP. Max 50MB.    ||
|          |  +------------------------------------------+|
|          |                                              |
|          |  Photos (24)    [Select] [Start Slideshow]   |
|          |                                              |
|          |  +------+ +------+ +------+ +------+        |
|          |  |      | |      | |      | |      |        |
|          |  | img  | | img  | | img  | | img  |        |
|          |  | [*]  | |      | |      | |      |        |
|          |  +------+ +------+ +------+ +------+        |
|          |  +------+ +------+ +------+ +------+        |
|          |  |      | |      | |      | |      |        |
|          |  | img  | | img  | | img  | | img  |        |
|          |  |      | |      | |      | |      |        |
|          |  +------+ +------+ +------+ +------+        |
|          |                                              |
+----------+----------------------------------------------+

[*] = star icon indicating cover photo
```

**Album Details Panel:**

- Collapsible panel, default expanded on new albums, collapsed on existing.
- Title input: Text input, required.
- Slug input: Text input, auto-generated from title, editable. `--text-sm --font-mono`.
- Description input: Textarea, optional, 3 rows.
- Hero toggle: Checkbox with label "Include in hero rotation". When checked, random photos from this album appear in the site hero.
- Save button: Primary button, top-right of page. Shows spinner when saving. Disabled when no changes.

**Upload Zone:**

- Height: 160px when empty, shrinks to 80px once photos exist.
- Border: 2px dashed `var(--border-default)`, `var(--radius-lg)`.
- Hover / drag-over: border-color `var(--accent-primary)`, bg `var(--accent-primary-muted)`.
- Center content: upload cloud icon (32px, `var(--text-tertiary)`), text "Drag & drop photos here", "or click to browse" in `--text-sm var(--text-tertiary)`.
- "Browse Files" button: Secondary button.
- Accepted file types: `.jpg, .jpeg, .png, .webp`. Max 50MB per file.
- Multiple file selection enabled.

**Upload Progress (shown during upload, replaces or overlays upload zone):**

```
+------------------------------------------+
| Uploading 6 files...                      |
|                                          |
| [thumb] sunset.jpg     [=========-] 89% |
| [thumb] beach.jpg      [====------] 42% |
| [thumb] waves.jpg      [==========] Done |
| [thumb] rocks.jpg      Queued...         |
| [thumb] pier.jpg       Queued...         |
| [thumb] shells.jpg     Queued...         |
|                                          |
| [Cancel All]                             |
+------------------------------------------+
```

- Each file: 48px row with thumbnail preview (40x40, generated client-side from file), filename, progress bar, percentage.
- Progress bar: 120px wide, `var(--bg-tertiary)` track, `var(--accent-primary)` fill, `var(--radius-full)`.
- States per file: Queued (gray text), Uploading (progress bar), Done (green checkmark), Error (red X with retry link).
- "Cancel All" secondary button at bottom.
- Concurrent uploads: max 3 simultaneous, queue the rest.

**Photo Grid:**

- Section heading "Photos (24)" with action buttons right-aligned.
- `[Select]` toggles bulk selection mode. `[Start Slideshow]` opens slideshow for this album.
- Grid uses square thumbnails: `object-fit: cover`, `aspect-ratio: 1`, `var(--radius-md)`.
- Grid columns: 2 mobile, 3 sm, 4 md, 5 lg, 6 xl.
- Gap: `var(--space-2)`.
- Cover photo indicator: small star icon badge, top-left corner, `var(--accent-warning)` background, 24px circle.

**Photo Hover State:**

```
+------------------+
|                  |
|     photo        |
|             [*]  |  <- set as cover
|  [edit] [delete] |  <- action buttons
+------------------+
```

- Overlay on hover: `var(--overlay-scrim)` at 60% opacity.
- Bottom-right: row of icon buttons (edit pencil, trash). 32px each, white icons.
- Top-right: star icon button (set/unset as cover). Filled star if current cover.
- All buttons appear on hover only (desktop). On mobile, tap photo to reveal, tap again to dismiss or tap action.

**Bulk Selection Mode:**

```
+------+ +------+ +------+ +------+
|[x]   | |[ ]   | |[x]   | |[ ]   |
| img  | | img  | | img  | | img  |
|      | |      | |      | |      |
+------+ +------+ +------+ +------+

Selected: 2 photos    [Delete Selected] [Cancel]
```

- Each photo gets a checkbox overlay, top-left, 24px.
- Selection: click toggles individual photos. "Select All" link in header.
- Action bar: sticky at bottom of viewport. `var(--bg-secondary)`, `var(--shadow-lg)`.
- Actions: "Delete Selected" (danger button), "Cancel" (secondary button).
- Delete confirmation: modal dialog -- "Delete 2 photos? This cannot be undone." with Cancel and Delete buttons.

**Photo Reorder:**

- Photos are draggable within the grid.
- Drag feedback: dragged photo scales to 1.05, shadow `var(--shadow-xl)`, other photos shift with 200ms animation.
- Drop: photo slots into new position, grid re-flows.
- New order auto-saved (debounced 1 second after last drag).

**Photo Edit (caption):**

- Clicking edit icon opens an inline panel below the photo or a modal:

```
+------------------------------------------+
| Edit Photo                         [X]   |
|                                          |
| +------+  Caption:                       |
| |      |  [A sunny day at the beach   ]  |
| | img  |  [                            ]  |
| |      |                                 |
| +------+                                 |
|                                          |
|            [Cancel]  [Save]              |
+------------------------------------------+
```

- Modal: 480px max-width, centered, `var(--bg-secondary)`, `var(--radius-lg)`, `var(--shadow-xl)`.
- Photo preview: 120x120px, `object-fit: cover`.
- Caption: Textarea, 3 rows.
- Buttons: Cancel (secondary), Save (primary).

### 4.3 Site Settings (/admin/site)

```
+----------+----------------------------------------------+
|          |                                              |
|  ADMIN   |  Site Settings                     [Save]    |
|          |                                              |
| Dashboard|  General                                     |
| Albums   |  -----------------------------------------   |
| Settings |  Site Title:                                 |
|          |  [My Photography Portfolio              ]    |
| -------- |                                              |
| View Site|  Site Description:                           |
| Sign Out |  [Landscapes and street photography     ]    |
|          |  [from around the world.                ]    |
|          |                                              |
|          |  Hero Settings                               |
|          |  -----------------------------------------   |
|          |  Cycling Interval:                           |
|          |  [====o----------] 6 seconds                 |
|          |  (How long each hero image displays)         |
|          |                                              |
|          |  Slideshow Defaults                          |
|          |  -----------------------------------------   |
|          |  Default Interval:                           |
|          |  [=======o-------] 5 seconds                 |
|          |  (Default time between slideshow photos)     |
|          |                                              |
|          |  Default Transition:                         |
|          |  ( ) Crossfade                               |
|          |  ( ) Slide                                   |
|          |  ( ) Fade to Black                           |
|          |                                              |
+----------+----------------------------------------------+
```

**Layout:**

- Single-column form, max-width 640px.
- Sections separated by heading + horizontal rule.
- Save button: top-right, sticky on scroll. Same behavior as album save.

**Settings Fields:**

- Site Title: Text input, required. Max 100 characters. Shown in nav and hero.
- Site Description: Textarea, optional. 2 rows. Shown in hero subtitle and meta tags.
- Hero Cycling Interval: Slider, range 3s to 30s, default 6s. Step 1s. Value displayed next to slider. Helper text below in `--text-xs var(--text-tertiary)`.
- Default Slideshow Interval: Slider, range 2s to 15s, default 5s. Step 1s.
- Default Transition: Radio button group, 3 options. Vertical stack.

---

## 5. Component Specifications

### 5.1 PhotoGrid

Justified-row photo grid that respects aspect ratios.

**Props:**
```
photos:         Array<{ id, src, thumbSrc, width, height, caption }>
targetRowHeight: number (default: 240)
gap:            number (default: 8)
onPhotoClick:   (photoId: string, index: number) => void
draggable:      boolean (default: false)
selectable:     boolean (default: false)
selectedIds:    Set<string>
onSelectionChange: (ids: Set<string>) => void
onReorder:      (fromIndex: number, toIndex: number) => void
```

**States:**
- Default: justified rows of photos
- Loading: skeleton rows (see Section 9)
- Empty: empty state message
- Draggable: photos show grab cursor, reorder on drag
- Selectable: checkbox overlay on each photo

**Responsive:** Target row height adjusts per breakpoint (200/220/240/280px). Gap is constant 8px.

**Accessibility:** Grid role, each photo is a button with aria-label from caption. Arrow key navigation between photos.

### 5.2 PhotoCard

Individual photo thumbnail within a grid.

**Props:**
```
src:            string (thumbnail URL)
blurHash:       string (BlurHash placeholder)
width:          number
height:         number
caption:        string
isCover:        boolean
onClick:        () => void
onSetCover:     () => void
onEdit:         () => void
onDelete:       () => void
selectable:     boolean
selected:       boolean
onSelect:       () => void
showActions:    boolean (admin only)
```

**States:**
- Default: photo displayed, no overlay
- Loading: BlurHash placeholder, then image fades in (300ms)
- Hover (desktop): semi-transparent overlay with action buttons (admin) or subtle border highlight (public)
- Selected: blue border (2px `var(--accent-primary)`), checkbox checked
- Cover: star badge top-left
- Error: gray placeholder with broken-image icon

**Responsive:** Grows/shrinks with grid. Min-width set by grid algorithm.

**Accessibility:** `role="button"`, `aria-label` from caption or "Photo {index}", `tabindex="0"`. Actions accessible via keyboard (Enter to open, context menu for admin actions).

### 5.3 Lightbox

Fullscreen overlay photo viewer with navigation.

**Props:**
```
photos:         Array<{ id, src, fullSrc, width, height, caption }>
initialIndex:   number
onClose:        () => void
onIndexChange:  (index: number) => void
```

**States:**
- Opening: backdrop fades in (200ms), photo scales from 0.95 to 1.0 (300ms)
- Viewing: photo centered, controls visible
- Navigating: current photo slides out, next slides in (200ms)
- Closing: reverse of opening animation
- Loading: spinner centered where photo will appear
- Error: "Failed to load image" message with retry link

**Responsive:**
- Desktop: photo max 90vw x 80vh. Arrows on left/right edges.
- Mobile: photo max 100vw x 70vh. Swipe to navigate. Arrows hidden. Tap to toggle UI.

**Accessibility:**
- `role="dialog"`, `aria-modal="true"`, `aria-label="Photo viewer"`.
- Focus trapped within lightbox.
- Close on Escape. Navigate with Left/Right arrows.
- Photo `alt` text from caption.
- Screen reader announces "Photo X of Y: caption" on navigation.

### 5.4 HeroBanner

Cycling hero images with crossfade and text overlay.

**Props:**
```
images:         Array<{ src, alt }>
interval:       number (ms, default: 6000)
title:          string
subtitle:       string
ctaText:        string
ctaHref:        string
```

**States:**
- Loading: first image loading, show solid `var(--bg-primary)` background
- Active: cycling images with crossfade
- Single image: if only 1 image, static display (no cycling)
- No images: solid `var(--bg-primary)` with text only
- Paused: cycling pauses when page is not visible (Page Visibility API)

**Responsive:**
- Desktop: 100vh height, text bottom-left
- Mobile: 80vh height (leaves room for scroll hint), text centered

**Accessibility:**
- `role="banner"`, each image has alt text.
- Respects `prefers-reduced-motion`: disables cycling, shows static first image.
- CTA button is keyboard-focusable.

### 5.5 SlideshowPlayer

Fullscreen slideshow with auto-advance and controls.

**Props:**
```
albums:         Array<{ id, title, slug, photos: Photo[] }>
initialAlbumIndex: number (default: 0)
initialPhotoIndex: number (default: 0)
interval:       number (ms, default: 5000)
transition:     "crossfade" | "slide" | "fade-to-black"
onExit:         () => void
```

**States:**
- Playing: auto-advancing, controls auto-hidden after 3s
- Paused: controls visible, not auto-advancing
- Between albums (playlist): album title card shown for 1.5s
- Loading: spinner on image area
- Controls visible: mouse/touch activity shows controls
- Controls hidden: 3s idle, controls fade out (300ms)
- Exiting: fade out (300ms), then callback

**Responsive:**
- All breakpoints: true fullscreen. Controls scale slightly smaller on mobile.
- Mobile: touch gestures (swipe left/right/down).
- Desktop: keyboard controls.

**Accessibility:**
- Focus trapped in player.
- `aria-live="polite"` region announces photo transitions.
- All controls labeled with aria-label.
- Escape exits.
- `prefers-reduced-motion`: instant transitions, no animation.

### 5.6 UploadZone

Drag-and-drop file upload area with progress tracking.

**Props:**
```
accept:         string (default: "image/jpeg,image/png,image/webp")
maxFileSize:    number (bytes, default: 50 * 1024 * 1024)
maxConcurrent:  number (default: 3)
onUpload:       (file: File) => Promise<UploadResult>
onComplete:     (results: UploadResult[]) => void
```

**States:**
- Empty: dashed border, upload icon, instructional text
- Drag over: accent border, accent background tint, "Drop to upload" text
- Uploading: progress list replaces drop zone content
- Error (file rejected): toast notification -- "File too large" or "Unsupported format"
- Complete: all files done, auto-dismiss after 2s, photos appear in grid

**Responsive:**
- Desktop: large drop area. Drag-and-drop primary interaction.
- Mobile: drop area shorter (80px), "Browse Files" button prominent. Native file picker on tap. Camera option shown on mobile file picker.

**Accessibility:**
- Drop zone: `role="button"`, keyboard-activatable to open file picker.
- Upload progress: `role="progressbar"` with `aria-valuenow`.
- Announces completions via `aria-live="polite"`.

### 5.7 AlbumCard

Card component for album grid display.

**Props:**
```
title:          string
slug:           string
coverSrc:       string
coverBlurHash:  string
photoCount:     number
href:           string
```

**States:**
- Default: cover photo, title, count
- Loading: skeleton placeholder
- Hover: translateY(-2px), shadow, border highlight
- No cover: gray placeholder with camera icon

**Visual Structure:**
```
+-------------------+
|                   |
|   Cover Photo     |   aspect-ratio: 3/2
|   (object-fit:    |   overflow: hidden
|    cover)         |
|                   |
+-------------------+
|  Album Title      |   --text-base --font-semibold
|  24 photos        |   --text-sm var(--text-tertiary)
+-------------------+
                        padding: --space-4 on text area
```

**Responsive:** Cards fill their grid column. Cover photo aspect ratio stays 3:2.

**Accessibility:** Entire card is a link. `aria-label="Album Title, 24 photos"`.

### 5.8 DragReorderList

Generic drag-and-drop reorder for lists or grids.

**Props:**
```
items:          Array<{ id: string, [key: string]: any }>
renderItem:     (item, dragHandleProps) => ReactNode
direction:      "vertical" | "grid"
onReorder:      (items: Array<{ id: string }>) => void
disabled:       boolean
```

**States:**
- Default: items in order, drag handles show grab cursor
- Dragging: picked-up item has shadow, elevated z-index. Other items shift with 200ms animation to show drop targets.
- Drop indicator: blue line (vertical) or blue border (grid) at drop position
- Disabled: no drag handles, no cursor changes

**Responsive:**
- Touch: long-press (300ms) to initiate drag on mobile
- Desktop: click-and-drag on handle

**Accessibility:**
- Drag handles: `role="button"`, `aria-roledescription="sortable"`.
- Instructions announced: "Press space to pick up. Use arrow keys to move. Press space to drop."
- Arrow key reorder as keyboard alternative.

### 5.9 AdminNav

Navigation component for admin section.

**Props:**
```
currentPath:    string
siteName:       string
```

**States:**
- Desktop: fixed sidebar, 240px
- Mobile: bottom tab bar, 64px
- Active item: accent background tint, accent text color

**Structure:** See Section 2.3 for layout details.

**Accessibility:** `<nav aria-label="Admin navigation">`, current page indicated with `aria-current="page"`.

---

## 6. Interaction Design

### 6.1 Photo Upload Flow

```
Step 1: User navigates to /admin/albums/[slug]
        Upload zone is visible (large if no photos, compact if photos exist)

Step 2: User initiates upload
        Option A: Drags files onto upload zone
                  -> Zone highlights with accent border
                  -> Drop triggers upload
        Option B: Clicks "Browse Files" button
                  -> Native file picker opens (camera option on mobile)
                  -> Selection triggers upload
        Option C: Pastes from clipboard (desktop only)
                  -> If image data, triggers upload

Step 3: Validation (client-side, instant)
        - Check file type (jpg/png/webp only)
        - Check file size (< 50MB)
        - Rejected files: toast notification with reason
        - Accepted files: add to upload queue

Step 4: Upload progress
        - Upload zone transforms to progress list
        - Each file shows: thumbnail (client-side preview), filename, progress bar
        - Max 3 concurrent uploads
        - Remaining files show "Queued..."
        - Cancel button per file and "Cancel All"

Step 5: Completion
        - Each file: progress bar fills, checkmark icon replaces bar
        - On completion: new photo appears at END of photo grid with fade-in (300ms)
        - Upload zone resets to compact state after all complete (2s delay)
        - If errors: error files remain in list with retry button

Step 6: Post-upload
        - If first photo in album, auto-set as cover
        - User can immediately reorder, edit caption, or set cover
```

### 6.2 Album Creation Flow

```
Step 1: User clicks "+ New Album" on dashboard
        -> Navigates to /admin/albums/new

Step 2: Album details panel is expanded (default for new albums)
        - Title field is focused automatically
        - Slug auto-generates as user types title
          (lowercase, hyphens for spaces, strip special chars)
        - Slug field editable if user wants custom slug

Step 3: User fills in title (required), description (optional)
        - Hero checkbox unchecked by default

Step 4: User clicks "Save"
        - Validates: title required, slug unique
        - On error: field highlighted red, error message below field
        - On success: URL changes to /admin/albums/[new-slug]
        - Toast: "Album created"
        - Upload zone becomes active

Step 5: User uploads photos (see Upload Flow)
```

### 6.3 Slideshow Entry and Control Flow

```
Entry Points:
  A. Album detail page -> "Start Slideshow" button
     -> Opens /slideshow/[slug] starting at photo 1

  B. Album detail page -> click photo -> lightbox -> (future: "Slideshow from here")
     -> Opens slideshow starting at clicked photo

  C. Albums index -> "Slideshow All Albums" button
     -> Opens /slideshow?albums=all in playlist mode

  D. Admin album page -> "Start Slideshow" button
     -> Same as (A)

  E. Direct URL: /slideshow/[slug] or /slideshow?albums=slug1,slug2

Entry Behavior:
  1. Request fullscreen (Fullscreen API)
  2. If denied, use viewport-filling overlay
  3. Load first photo
  4. Start auto-advance timer
  5. Show controls for 3 seconds, then auto-hide

During Slideshow:
  - Auto-advances at configured interval
  - Mouse move / touch: reveal controls, reset 3s hide timer
  - Play/Pause: toggles auto-advance, keeps controls visible while paused
  - Prev/Next: navigates, resets auto-advance timer
  - Speed slider: adjusts interval in real-time
  - Photo counter updates on each transition

Playlist Mode Specifics:
  - Plays through all photos in album 1, then album 2, etc.
  - Between albums: fade to black, show album title card (1.5s), fade into next
  - Skip album buttons ([<<] [>>]) jump to previous/next album boundary
  - Playlist bar shows current album, next album, total count
  - After last photo of last album: loop back to album 1 photo 1

Exit:
  - Click exit button, press Escape, or swipe down (mobile)
  - Exit fullscreen
  - Return to page that launched the slideshow
```

### 6.4 Playlist Building Flow

In v1, playlist mode uses predefined sets. No custom playlist builder UI.

```
Available Playlist Modes:
  1. Single album:     /slideshow/[slug]
  2. All albums:       /slideshow?albums=all (uses album display order)
  3. Specific albums:  /slideshow?albums=slug1,slug2,slug3

Future v2: Custom playlist builder with:
  - Album picker (checkbox list)
  - Drag to reorder
  - Save as named playlist
  - Share link
```

### 6.5 Bulk Photo Selection and Actions

```
Step 1: User clicks "Select" button in photo grid header
        -> Grid enters selection mode
        -> Each photo shows unchecked checkbox overlay (top-left)
        -> "Select" button changes to "Select All" / "Deselect All" toggle
        -> Action bar appears at bottom of viewport (sticky)

Step 2: User selects photos
        -> Tap/click individual photos to toggle selection
        -> Checkbox fills on selection, blue border appears
        -> Action bar updates: "X photos selected"
        -> "Select All" selects all, "Deselect All" clears all

Step 3: User performs action
        -> "Delete Selected": opens confirmation modal
           Modal: "Delete X photos? This cannot be undone."
           [Cancel] [Delete] (danger button)
           -> On confirm: photos removed with fade-out animation
           -> Toast: "X photos deleted"
           -> Grid re-flows
        -> More actions in future (download, move to album)

Step 4: Exit selection mode
        -> "Cancel" button returns to normal grid view
        -> Selection mode also exits after a bulk action completes
```

### 6.6 Mobile Touch Interactions

```
Lightbox:
  - Swipe left:        Next photo
  - Swipe right:       Previous photo
  - Pinch:             Zoom in/out (future v2)
  - Tap center:        Toggle UI visibility (captions, arrows, counter)
  - Tap edges:         Not used (too easy to accidentally trigger)
  - Swipe down:        Close lightbox

Slideshow:
  - Swipe left:        Next photo
  - Swipe right:       Previous photo
  - Swipe down:        Exit slideshow
  - Tap:               Toggle controls visibility

Photo Grid (Admin, reorder mode):
  - Long-press (300ms): Pick up photo for reorder
  - Drag:              Move to new position
  - Release:           Drop in place

Album List (Admin, reorder mode):
  - Long-press on row: Pick up for reorder
  - Drag:             Move to new position

General:
  - All touch targets: minimum 44px x 44px
  - Swipe velocity threshold: 0.5px/ms to register as swipe vs. scroll
  - Swipe distance threshold: 50px minimum
```

---

## 7. Responsive Strategy

### 7.1 Breakpoint Behavior by Page

#### Landing Page

| Element         | Mobile (<640) | Tablet (768-1023) | Desktop (1024+) |
|-----------------|---------------|-------------------|-----------------|
| Hero height     | 80vh          | 90vh              | 100vh           |
| Hero text       | Centered, text-3xl | Centered, text-4xl | Left-aligned, text-5xl |
| CTA button      | Full width    | Auto width        | Auto width      |
| Album grid      | 1 column      | 2 columns         | 3 columns       |
| Album card cover| 2:1 ratio     | 3:2 ratio         | 3:2 ratio       |

#### Album Detail

| Element         | Mobile (<640) | Tablet (768-1023) | Desktop (1024+) |
|-----------------|---------------|-------------------|-----------------|
| Photo grid rows | 200px target  | 220px target      | 280px target    |
| Grid columns    | 2 min         | 3 min             | 4+ justified    |
| Slideshow btn   | Full width    | Auto, right       | Auto, right     |
| Lightbox arrows | Hidden (swipe)| Visible           | Visible         |

#### Admin Dashboard

| Element         | Mobile (<640) | Tablet (768-1023) | Desktop (1024+) |
|-----------------|---------------|-------------------|-----------------|
| Navigation      | Bottom bar    | Bottom bar        | Sidebar 240px   |
| Stats cards     | 1 column      | 3 columns         | 3 columns       |
| Album list      | Compact rows  | Full rows         | Full rows       |

#### Admin Album Management

| Element         | Mobile (<640) | Tablet (768-1023) | Desktop (1024+) |
|-----------------|---------------|-------------------|-----------------|
| Navigation      | Bottom bar    | Bottom bar        | Sidebar 240px   |
| Upload zone     | 80px height   | 120px height      | 160px height    |
| Photo grid      | 2 columns     | 3 columns         | 5 columns       |
| Details panel   | Full width    | Full width        | Full width      |
| Action buttons  | Stacked       | Row               | Row             |

### 7.2 Grid Column Counts

```
                    Mobile  sm    md    lg    xl    2xl
Photo grid (public) 2       2     3     4     5     6
Photo grid (admin)  2       3     4     5     6     6
Album cards         1       2     2     3     4     4
Stats cards         1       1     3     3     3     3
```

### 7.3 Touch Targets

All interactive elements must meet minimum 44x44px touch target, even if visually smaller. Use padding or negative margin to extend touch area when the visual element is smaller.

```
Buttons:         min-height 44px (40px visual + 2px padding each side)
Icon buttons:    44px x 44px hit area
List items:      min-height 48px
Checkboxes:      44px x 44px hit area (visual checkbox 20px, padded)
Drag handles:    44px x 44px hit area
Nav links:       44px min-height
```

### 7.4 Mobile-Specific Patterns

- **Bottom sheets** for action menus (delete confirmation, photo actions on mobile).
- **Pull-to-refresh** on album listing pages.
- **Swipe gestures** in lightbox and slideshow.
- **Sticky action bars** at bottom of viewport for bulk selection.
- **Native file picker** includes camera option on mobile.
- **Viewport units** (`dvh` instead of `vh`) to account for mobile browser chrome.

---

## 8. Accessibility

### 8.1 Keyboard Navigation

All interactive elements must be reachable and operable via keyboard.

```
Tab:            Move focus to next interactive element
Shift+Tab:      Move focus to previous interactive element
Enter/Space:    Activate buttons, links, checkboxes
Escape:         Close modals, lightbox, slideshow, menus
Arrow keys:     Navigate within grids, sliders, radio groups, reorder lists

Photo grid:     Arrow keys move between photos, Enter opens lightbox
Lightbox:       Left/Right arrows navigate, Escape closes
Slideshow:      Full keyboard control (see Section 3.4)
Drag reorder:   Space to pick up, Arrow keys to move, Space to drop
Admin nav:      Arrow keys move between nav items
```

### 8.2 Focus Management

```
Modal open:     Focus moves to first focusable element in modal
Modal close:    Focus returns to the element that triggered the modal
Lightbox open:  Focus moves to the lightbox container
Lightbox close: Focus returns to the photo that was clicked
Slideshow exit: Focus returns to the element that started the slideshow
Page load:      Focus on main content area (skip-nav link at top)
Route change:   Focus on h1 of new page
Dropdown open:  Focus on first menu item
Dropdown close: Focus returns to trigger button
```

Focus trapping in modals, lightbox, and slideshow: Tab cycles within the component. Focus does not escape to page behind.

Focus indicator: `2px solid var(--border-focus)` with `2px offset`. Visible on all focusable elements. Never remove outline without a replacement.

### 8.3 Alt Text Strategy

Priority order for image alt text:

1. **Caption** (user-entered): Use as-is. "A sunset over the Pacific Ocean"
2. **Filename** (cleaned): Strip extension, replace hyphens/underscores with spaces, title-case. `sunset-pacific-ocean.jpg` -> "Sunset pacific ocean"
3. **Generic**: "Photo {index} in {album title}"
4. **Decorative hero images**: `alt=""` with `role="presentation"` (they are decorative since the title conveys the meaning).

Album cover images: `alt="Cover photo for {album title}"`.
Thumbnails: Same alt as full image.

### 8.4 ARIA Labels and Roles

```
Photo grid:         role="grid", aria-label="Photos in {album}"
Photo grid row:     role="row"
Photo cell:         role="gridcell"
Photo button:       role="button", aria-label="{caption or generic}"

Lightbox:           role="dialog", aria-modal="true", aria-label="Photo viewer"
Lightbox photo:     role="img", alt="{caption}"
Lightbox counter:   aria-live="polite", aria-label="Photo {n} of {total}"

Slideshow:          role="application", aria-label="Slideshow"
Slideshow photo:    aria-live="polite"
Play/Pause:         aria-label="Play slideshow" / "Pause slideshow"
                    aria-pressed for toggle state

Upload zone:        role="button", aria-label="Upload photos, drag and drop or click to browse"
Upload progress:    role="progressbar", aria-valuenow, aria-valuemin="0", aria-valuemax="100"

Admin nav:          nav, aria-label="Admin navigation"
Public nav:         nav, aria-label="Main navigation"
Skip link:          "Skip to main content" link, first element in DOM
```

### 8.5 Color Contrast

All text meets WCAG AA minimum contrast ratios:

```
var(--text-primary) #F0F0F2 on var(--bg-primary) #0A0A0B     = 18.5:1  (AAA)
var(--text-secondary) #9E9EA8 on var(--bg-primary) #0A0A0B   = 7.8:1   (AAA)
var(--text-tertiary) #636370 on var(--bg-primary) #0A0A0B    = 4.0:1   (AA for large text only)
var(--accent-primary) #6B8AFF on var(--bg-primary) #0A0A0B   = 6.4:1   (AA)
White #FFFFFF on var(--accent-primary) #6B8AFF                = 3.9:1   (AA for large text)
White #FFFFFF on var(--accent-danger) #FF6B6B                 = 3.2:1   (use bold/large text only)
```

Note: `--text-tertiary` is only used for non-essential metadata (photo counts, timestamps). Critical information must use `--text-secondary` or `--text-primary`.

Danger button text is white on red. Keep button text at `--font-semibold` (600 weight) and minimum `--text-sm` (14px) to meet AA for large text.

### 8.6 Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  /* Disable all transforms */
  * { transition-duration: 0.01ms !important; }

  /* Hero: static first image, no cycling */
  .hero-banner { animation: none; }

  /* Slideshow: instant photo swap, no crossfade */
  .slideshow-transition { transition: none; }

  /* Lightbox: instant open/close, no scale animation */
  .lightbox-enter { animation: none; }

  /* Drag reorder: items snap instantly, no shift animation */
  .drag-item { transition: none; }

  /* Keep focus indicators visible (they are functional, not decorative) */
}
```

---

## 9. Loading States and Empty States

### 9.1 Skeleton Screens

Photo grids show placeholder skeletons while loading.

```
Photo Grid Skeleton:
+--------+ +------------+ +------+ +----------+
|  ::::  | |   ::::     | | :::: | |  ::::    |
|  ::::  | |   ::::     | | :::: | |  ::::    |
|  ::::  | |   ::::     | | :::: | |  ::::    |
+--------+ +------------+ +------+ +----------+
+------------+ +------+ +--------+ +----------+
|   ::::     | | :::: | |  ::::  | |  ::::    |
|   ::::     | | :::: | |  ::::  | |  ::::    |
|   ::::     | | :::: | |  ::::  | |  ::::    |
+------------+ +------+ +--------+ +----------+

:::: = animated shimmer effect (gradient sweep left to right, 1.5s loop)
```

- Skeleton shapes: rounded rectangles matching expected photo positions.
- Background: `var(--bg-tertiary)`.
- Shimmer: linear-gradient overlay sweeping left to right.
- Aspect ratios: use a mix of common ratios (3:2, 4:3, 16:9, 1:1) for visual variety.
- Duration: show skeletons for minimum 200ms to avoid flash (even if data loads fast).

**Album Card Skeleton:**
```
+-------------------+
|                   |
|   :::::::::::     |   Cover photo area
|   :::::::::::     |
|                   |
+-------------------+
|  ========         |   Title (gray bar, 60% width)
|  ====             |   Count (gray bar, 30% width)
+-------------------+
```

### 9.2 BlurHash Placeholders

Individual photos use BlurHash for smooth loading.

```
Load sequence:
1. Render BlurHash as tiny canvas (4x3 pixels, scaled up with CSS, blurred)
2. Start loading actual image in background
3. When image loads: crossfade from BlurHash to real image (300ms)

BlurHash canvas:
  - Width/height matches photo container
  - CSS: filter blur(20px), transform scale(1.2) to hide edge artifacts
  - Computed from image at upload time, stored in database

Fallback (no BlurHash):
  - Solid var(--bg-tertiary) background
  - Fade-in when image loads
```

### 9.3 Empty States

#### Empty Album (no photos yet)

```
+-----------------------------------------------+
|                                               |
|              [camera icon, 48px]              |
|                                               |
|           No photos in this album             |
|     Upload some photos to get started.        |
|                                               |
+-----------------------------------------------+
```

- Public view: icon + "No photos in this album yet." in `--text-lg var(--text-secondary)`. Centered in content area.
- Admin view: same, but the upload zone is already visible above, so the empty state is below it: "Drag photos above or click Browse to upload."

#### Empty Site (no albums)

```
+-----------------------------------------------+
|                                               |
|         [folder-plus icon, 48px]              |
|                                               |
|          Welcome to your portfolio            |
|     Create your first album to begin.         |
|                                               |
|          [ + Create Album ]                   |
|                                               |
+-----------------------------------------------+
```

- Public view: "No albums yet. Check back soon." with a simple illustration or icon.
- Admin view (dashboard): welcoming message with prominent "Create Album" primary button.

#### First-Run Experience (admin, initial setup)

On very first admin login with no site settings configured:

```
+-----------------------------------------------+
|                                               |
|           Welcome to Poor Man's Flickr        |
|     Let's set up your photography portfolio.  |
|                                               |
|     Step 1: Give your site a name             |
|     Site Title: [                          ]  |
|                                               |
|     Step 2: Add a description (optional)      |
|     [                                      ]  |
|                                               |
|              [ Get Started ]                  |
|                                               |
+-----------------------------------------------+
```

- Simple 2-field form, centered, max-width 480px.
- On submit: saves settings, redirects to dashboard with empty-site state.
- Skippable: "Skip for now" link below button.

### 9.4 Upload Progress States

Per-file states during upload:

```
State       Visual                          Color/Icon
-----       ------                          ----------
Queued      "Queued..." text, no bar        var(--text-tertiary)
Uploading   Progress bar filling            var(--accent-primary)
Processing  "Processing..." text, spinner   var(--text-secondary)
Complete    "Done" text, checkmark icon     var(--accent-success)
Error       "Failed" text, retry link       var(--accent-danger)
Cancelled   "Cancelled" text                var(--text-tertiary)
```

Overall upload progress: shown in page title `"Uploading (3/8) - Album Name"` so it is visible in browser tabs.

### 9.5 Error States

#### Failed Photo Load

```
+-------------------+
|                   |
|   [broken-image]  |
|   Could not load  |
|                   |
+-------------------+
```

- Gray background `var(--bg-tertiary)`, broken-image icon centered, `--text-xs var(--text-tertiary)` text.
- In lightbox: "Failed to load image. [Retry]" centered, with retry link.

#### Failed Page Load

```
+-----------------------------------------------+
|                                               |
|           [alert-circle icon, 48px]           |
|                                               |
|       Something went wrong                    |
|   We couldn't load this page. Try again.      |
|                                               |
|          [ Retry ]   [ Go Home ]              |
|                                               |
+-----------------------------------------------+
```

- Centered in content area. Two buttons: Retry (primary), Go Home (secondary).

#### Network Error During Upload

- Toast notification: "Upload failed: network error. Retrying..." (auto-retry once).
- If retry fails: file row shows error state with manual "Retry" link.

#### 404 Album Not Found

```
+-----------------------------------------------+
|                                               |
|              [search icon, 48px]              |
|                                               |
|          Album not found                      |
|   The album you're looking for doesn't exist. |
|                                               |
|          [ Browse Albums ]                    |
|                                               |
+-----------------------------------------------+
```

---

## Appendix A: Tailwind Configuration Summary

```js
// tailwind.config.js key values
module.exports = {
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0A0A0B',
          secondary: '#141416',
          tertiary: '#1E1E22',
          elevated: '#28282E',
        },
        text: {
          primary: '#F0F0F2',
          secondary: '#9E9EA8',
          tertiary: '#636370',
        },
        border: {
          default: '#2A2A30',
          hover: '#3E3E48',
          focus: '#6B8AFF',
        },
        accent: {
          primary: '#6B8AFF',
          'primary-hover': '#8BA3FF',
          danger: '#FF6B6B',
          'danger-hover': '#FF8A8A',
          success: '#4ADE80',
          warning: '#FBBF24',
        },
      },
      fontFamily: {
        display: ['Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
      transitionDuration: {
        fast: '100ms',
        normal: '200ms',
        slow: '300ms',
        slower: '500ms',
        crossfade: '1500ms',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.16, 1, 0.3, 1)',
        'in-out': 'cubic-bezier(0.45, 0, 0.55, 1)',
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
}
```

## Appendix B: Icon Set

Use [Lucide Icons](https://lucide.dev/) (MIT licensed, consistent stroke style). Key icons needed:

```
Navigation:     menu, x, chevron-left, chevron-right, arrow-left
Actions:        upload-cloud, plus, trash-2, edit-2, star, check, x
Media:          image, camera, play, pause, skip-back, skip-forward
UI:             search, settings, eye, log-out, grip-vertical, loader
Status:         alert-circle, check-circle, x-circle, info
```

Icon size: 20px default inline, 24px for primary actions, 32px for empty state illustrations, 48px for page-level empty states.

Stroke width: 1.5px (Lucide default).

---

*End of UI Design Document*
