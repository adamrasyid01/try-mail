# Redesign Quickstart Validation: Neubrutalism UI Overhaul

**Feature**: `001-temp-mail-service` (UI Redesign) | **Date**: 2026-11-09 | **Status**: Complete

---

## 1. Prerequisites

Same as the original quickstart — Node.js >= 18, npm >= 9, and a modern browser.

```bash
cd "D:/Kuliah Informatika PENS/Semester 7/MW-Pola Desain Perangkat Lunak/Projek Besar/trymail"
npm run dev
```

---

## 2. Visual Validation Scenarios

### Scenario R1: Neubrutalism Visual Identity

1. Open `http://localhost:5173` in a browser.
2. **Expected Outcomes**:
   - Page background is off-white/cream (`#fffdf7`), **not** dark slate.
   - All cards have thick black borders (`border-2 border-black`) and hard offset shadows (`shadow-[4px_4px_0px_0px_#000]`).
   - No glassmorphism, backdrop-blur, or transparent/translucent elements.
   - Typography is bold/extra-bold with high contrast (black on bright colors).
   - Hover on any button produces a "press-in" effect (shadow disappears, slight translate).

### Scenario R2: Emoticon-Free Interface

1. Inspect every visible UI element on the page.
2. **Expected Outcomes**:
   - Zero Unicode emoji characters (no `📬`, `⚡`, `🌐`, checkmarks as emoji, etc.).
   - Functional icons are rendered via Lucide React SVG components only.
   - Browser tab title uses text only (e.g., `(1) New Email | TryMail`), no emoji.

### Scenario R3: Button Layout — Change Address in Header

1. Locate the mailbox header card.
2. **Expected Outcomes**:
   - The email address is followed by **two** action buttons: "Copy Address" and "Change Address" (side by side).
   - Below the header, the ActionToolbar contains only "Refresh Inbox" (left) and "Delete" (right).
   - The "Change Address" button is **not** present in the ActionToolbar.

### Scenario R4: Responsive Behavior (Mobile)

1. Open browser DevTools and set viewport width to 375px (iPhone SE).
2. **Expected Outcomes**:
   - All components stack vertically in a single column.
   - Buttons in the header stack below the address field.
   - ActionToolbar buttons stretch to full width.
   - EmailDetailModal fills the viewport with appropriate padding.
   - No horizontal scrollbar appears.

### Scenario R5: Responsive Behavior (Tablet / Desktop)

1. Set viewport width to 768px and then 1024px+.
2. **Expected Outcomes**:
   - Address and action buttons display inline (side-by-side).
   - Main content area centers with `max-w-2xl`.
   - EmailDetailModal is centered with `max-w-3xl` and comfortable margins.

---

## 3. Functional Regression Check

All 5 original user stories (Quickstart Scenarios 1–5 from the main `quickstart.md`) **MUST** continue working identically after the visual redesign. No functionality changes are introduced.

```bash
npm test        # 16/16 tests must still pass
npm run typecheck  # Zero type errors
npm run build   # Clean production build
```

