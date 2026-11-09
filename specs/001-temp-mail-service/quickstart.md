# Quickstart Validation Guide: Temporary Disposable Email Service

**Feature**: `001-temp-mail-service` | **Date**: 2026-11-09 | **Status**: Complete

This guide details runnable verification scenarios to prove that the TryMail application, its multi-provider adapters, facade lifecycle, and observer notification system function end-to-end.

---

## 1. Prerequisites & Environment Setup

Ensure the following tools are available on the development machine:
- **Node.js**: $\ge 18.0.0$ (LTS recommended)
- **Package Manager**: `npm` ($\ge 9.x$) or `pnpm`
- **Modern Web Browser**: Chrome, Edge, Firefox, or Safari with Web Audio API enabled

### Setup Commands
```bash
# Navigate to the project root
cd "D:/Kuliah Informatika PENS/Semester 7/MW-Pola Desain Perangkat Lunak/Projek Besar/trymail"

# Install project dependencies
npm install

# Start the local development server
npm run dev
```

---

## 2. End-to-End Validation Scenarios

### Scenario 1: Initial Mailbox Provisioning & Clipboard Copy
**Goal**: Verify that a new disposable email address is automatically generated on startup and can be copied to the clipboard.

1. Open `http://localhost:5173` in a web browser.
2. **Observation**: Within 3 seconds, a valid temporary email address (e.g., `userXYZ@domain.com`) appears in the header card.
3. Click the **"Copy"** button adjacent to the address.
4. **Expected Outcome**:
   - The button label changes to `"Copied!"` with visual feedback for 2 seconds.
   - Pasting into a text editor yields the exact displayed email address.

---

### Scenario 2: Offline Simulation & Observer Notification Verification
**Goal**: Prove that the **Observer Pattern** triggers multiple decoupled listeners upon email receipt.

1. Open browser developer tools (**F12**) and view the **Console** tab.
2. In the TryMail UI, ensure the active provider is set to **"Mock Mail (Offline)"** (or select it from the Provider dropdown).
3. Click the **"Simulate Incoming Email"** button.
4. **Expected Outcomes**:
   - **Visual**: A new message with subject `"Your Verification Code: 994-123"` appears immediately in the Inbox List.
   - **Audio Listener**: A short high-frequency chime sound is played via the browser's Web Audio API.
   - **Tab Badge Listener**: The browser tab title changes from `TryMail` to `(1) New Email | TryMail`.
   - **Toast Alert Listener**: A toast notification pops up in the bottom-right corner with sender and subject preview.

---

### Scenario 3: Message Inspection & Safe Content Sanitization
**Goal**: Verify that rich HTML emails are rendered cleanly without executing embedded malicious scripts.

1. Click on the simulated or received email in the inbox list.
2. **Expected Outcomes**:
   - The message detail panel opens, displaying sender, receipt date, subject, and formatted HTML body.
   - The message read state transitions from unread to read (`isRead: true`), and the tab title badge count decrements accordingly.
   - Links in the message body include `target="_blank" rel="noopener noreferrer"`.
   - Any embedded `<script>` or `onload` tags are stripped with zero browser console script execution warnings.

---

### Scenario 4: Adapter Hot-Swapping (Multi-Provider Verification)
**Goal**: Verify that the **Adapter Pattern** allows swapping backing email providers at runtime.

1. In the provider dropdown menu, switch from **"Mock Mail"** to **"Mail.tm"** (or **"1secmail"**).
2. **Expected Outcomes**:
   - The Facade initiates a mailbox change via `switchProvider('mailtm')`.
   - A new email address with a domain from the chosen provider's active domain list is generated.
   - The previous inbox is cleanly reset without lingering interval timers or unhandled promise rejections.

---

### Scenario 5: Mailbox Lifecycle Reset & Storage Persistence
**Goal**: Verify session persistence across reloads and clean disposal on demand.

1. Reload the browser page (`F5`).
2. **Expected Outcome**: The active mailbox address and its existing received messages persist intact without resetting.
3. Click the **"Delete Mailbox"** button.
4. **Expected Outcome**: The session is purged from `sessionStorage`, previous messages are deleted, and a fresh mailbox address is generated immediately.

---

## 3. Automated Test Execution

Run the automated test suite covering all pattern contracts:
```bash
# Run unit & contract tests for Adapter, Facade, and Observer
npm test

# Run TypeScript strict type verification
npm run typecheck
```
All tests must report **PASS** with zero type errors.

