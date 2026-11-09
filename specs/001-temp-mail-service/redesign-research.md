# Redesign Research: Neubrutalism UI Overhaul for TryMail

**Feature**: `001-temp-mail-service` (UI Redesign Iteration) | **Date**: 2026-11-09 | **Status**: Complete

---

## 1. Neubrutalism Design Language — Core Visual Principles

### Decision
Adopt the **Neubrutalism** (Neo-Brutalism) design system across all TryMail UI components. This is a contemporary web design trend that fuses the rawness of brutalist aesthetics with modern usability patterns.

### Visual Pillars

| Property | Current (Glassmorphism) | Target (Neubrutalism) |
|---|---|---|
| **Borders** | `border border-slate-700/60` (thin, transparent) | `border-2 border-black` (thick, solid, opaque) |
| **Shadows** | `shadow-lg shadow-sky-500/5` (diffuse glow) | `shadow-[4px_4px_0px_0px_#000]` (hard offset, no blur) |
| **Backgrounds** | `bg-slate-800/80 backdrop-blur-md` (glass, translucent) | Solid flat colors (`bg-white`, `bg-yellow-300`, `bg-sky-300`, `bg-rose-300`) |
| **Border radius** | `rounded-2xl` (very rounded) | `rounded-md` to `rounded-lg` (slightly rounded, never fully pill) |
| **Typography** | Normal weight, slate colors | **Bold/Extra-bold**, high contrast (black on bright color) |
| **Hover effects** | Opacity/color transitions | `translate-x-[2px] translate-y-[2px] shadow-none` (press-in effect) |
| **Color palette** | Dark mode monochrome (slate-700/800/900) | Bright, saturated accent palette on light/white base |

### Color Palette Selection

| Role | Color | Tailwind Class | Usage |
|---|---|---|---|
| **Background** | Off-white | `bg-[#fffdf7]` | Page body background |
| **Card base** | White | `bg-white` | Card/panel backgrounds |
| **Primary accent** | Sky blue | `bg-sky-300` | Mailbox header, primary actions |
| **Secondary accent** | Yellow | `bg-yellow-300` | Simulation toolbar, highlights |
| **Danger accent** | Rose/pink | `bg-rose-300` | Delete actions |
| **Success accent** | Lime green | `bg-lime-300` | Status indicators, badges |
| **Text primary** | Black | `text-black` | Headings, body text |
| **Text secondary** | Dark gray | `text-gray-600` | Metadata, timestamps |
| **Border** | Black | `border-black` | All component borders |

### Rationale
- Neubrutalism is visually distinctive for academic project presentations — instantly recognizable and memorable.
- High contrast (black borders on bright colors) ensures excellent readability and accessibility.
- The hard shadow offset is the defining signature of the style, replacing the current glassmorphism/blur aesthetic entirely.

### Alternatives Considered
- *Glassmorphism (current)*: Retained as-is would not fulfill the redesign requirement.
- *Neumorphism*: Rejected — subtle inner/outer shadows are poorly visible on projector screens typical in academic presentations.
- *Material Design 3*: Rejected — too generic and widely used; doesn't create a distinctive visual identity for the project.

---

## 2. Emoticon & Emoji Removal Policy

### Decision
Remove all decorative Unicode emoji characters from the UI and from internal code string constants. Replace functional icons with Lucide React icon components where semantic meaning is needed.

### Scope
- `ProviderSelector.tsx`: Remove `⚡ Offline` and `🌐 Online` emoji from `<option>` labels.
- `constants.ts`: Remove `📬` from `NOTIFICATION_TITLES.NEW_MAIL_TITLE_PREFIX`.
- `MailboxHeader.tsx`: Verify no emoji in provider badge or status labels.
- `README.md` and `tasks.md`: Remove emoji headings (🏛️, ⚡, 📋, 🧪, 🚀, 👥, 📂, 🎯).

### Rationale
- User explicitly requested removal of all emoticons.
- Lucide React icons provide consistent sizing, styling, and accessibility (`aria-label`) attributes.
- Emoji rendering varies across operating systems and can appear broken on some platform/font combinations.

---

## 3. Layout Restructuring — Button Placement

### Decision
Relocate the "Change Address" (shuffle/regenerate) action button from the `ActionToolbar` to the `MailboxHeader`, positioned immediately to the right of the existing "Copy Address" button. The `ActionToolbar` will retain only two actions:
1. **Refresh Inbox** (left)
2. **Delete Mailbox** (right)

### Before (Current Layout)

```text
┌─────────────────────────────────────────┐
│ MailboxHeader                           │
│ [Email Address]  [Copy] [Regenerate ↻]  │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│ ActionToolbar                           │
│ [Refresh Inbox]    [Change Addr] [Del]  │
└─────────────────────────────────────────┘
```

### After (Redesigned Layout)

```text
┌─────────────────────────────────────────┐
│ MailboxHeader                           │
│ [Email Address]  [Copy] [Change Addr]   │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│ ActionToolbar                           │
│ [Refresh Inbox]              [Delete]   │
└─────────────────────────────────────────┘
```

### Rationale
- Grouping address-related actions (Copy + Change) in the header card is more semantically coherent.
- The ActionToolbar becomes a simpler two-button bar, reducing cognitive load.
- Aligns with common email client patterns where address actions live near the address display.

---

## 4. Responsive Breakpoint Strategy

### Decision
Adopt a **mobile-first** responsive approach with Tailwind's standard breakpoint system:

| Breakpoint | Width | Layout Behavior |
|---|---|---|
| **Base** (mobile) | < 640px | Single column, stacked buttons, full-width cards |
| **`sm`** | >= 640px | Side-by-side button groups, wider card padding |
| **`md`** | >= 768px | Increased max-width for main content area |
| **`lg`** | >= 1024px | `max-w-2xl` main container, comfortable spacing |

### Component-Specific Adaptations
- **MailboxHeader**: Email address and action buttons stack vertically on mobile, inline on `sm+`.
- **ActionToolbar**: Buttons span full width on mobile with `flex-col`, switch to `flex-row justify-between` on `sm+`.
- **InboxList / EmailCard**: Cards always full-width; internal padding reduces on mobile.
- **EmailDetailModal**: Takes `max-h-[95vh]` and reduced padding on mobile; `max-w-3xl` on desktop.
- **ProviderSelector**: Dropdown wraps below status on mobile; inline on `sm+`.
- **ToastContainer**: Full-width on mobile; fixed `max-w-sm` on desktop.

### Rationale
- Academic project evaluators may test on various screen sizes.
- The neubrutalism style with thick borders and solid colors naturally adapts well to mobile due to high visual contrast at any size.

