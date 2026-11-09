# Research & Architectural Decisions: Temporary Disposable Email Service

**Feature**: `001-temp-mail-service` | **Date**: 2026-11-09 | **Status**: Complete

This document consolidates technical research and architectural trade-off evaluations conducted during Phase 0 of the implementation planning workflow.

---

## 1. Disposable Mail Provider APIs & Adapter Architecture

### Decision
Implement a multi-provider strategy unified by the **Adapter Pattern** with three concrete adapters:
1. `MailTmAdapter` (Primary live provider via `https://api.mail.tm` — standard JSON REST API with domains, accounts, and messages endpoints).
2. `OneSecMailAdapter` (Secondary live provider via `https://www.1secmail.com/api/v1/` — lightweight query-parameter based fallback).
3. `MockMailAdapter` (Deterministic offline simulation engine with pre-seeded verification templates for offline evaluation, testing, and live presentation resilience).

### Rationale
- **Resilience**: Public temp mail APIs frequently experience IP-based rate limiting, Cloudflare challenges, or domain blacklisting by target registration platforms. Having hot-swappable adapters prevents demo failures during grading.
- **Academic Fidelity**: Directly implements the Gang of Four (GoF) **Adapter Pattern** by translating heterogeneous provider schemas into a unified `ITempMailProvider` interface.
- **Zero Configuration**: Both Mail.tm and 1secmail require zero paid API keys, enabling immediate client-side execution.

### Alternatives Considered
- *GuerrillaMail API*: Rejected due to complex legacy session token handling and frequent CORS blockage in modern browser environments.
- *Custom Node.js SMTP Backend*: Rejected as it introduces severe hosting and DNS MX record maintenance overhead, violating the client-first scope.

---

## 2. Facade Pattern for Mailbox Lifecycle Orchestration

### Decision
Create a centralized `TempMailFacade` class that coordinates multi-step mailbox setup and lifecycle operations behind unified high-level methods:
- `initMailbox(providerId?: string): Promise<TemporaryMailbox>`
- `refreshInbox(): Promise<IncomingEmail[]>`
- `readEmail(emailId: string): Promise<IncomingEmail>`
- `deleteMailbox(): Promise<void>`

### Rationale
- Setting up a temporary mailbox on providers like Mail.tm requires a 4-step sequence: (1) querying available domain names, (2) generating unique random account credentials, (3) authenticating to receive a JWT bearer token, and (4) initializing the polling listener.
- Exposing these granular steps directly to React UI components causes severe coupling, redundant boilerplate, and fragile error recovery.
- The Facade hides token storage (`sessionStorage`), active provider selection, and error translation from the presentation layer.

### Alternatives Considered
- *Direct React Hook Orchestration (`useTempMail` doing raw HTTP calls)*: Rejected because business logic would become tangled with React re-render cycles, violating Constitution Principle I (Clean Architecture).
- *Redux Toolkit / Thunk Orchestration*: Rejected as overengineered for a client-side utility where pure TypeScript class services provide superior decoupling and OOP design pattern demonstration.

---

## 3. Observer Pattern for Event-Driven Notifications

### Decision
Implement a classic GoF **Observer Pattern** using a framework-agnostic `MailEventManager` (Subject/Publisher) and an `IMailListener` (Subscriber) contract.
Three concrete listeners will be implemented:
1. `AudioAlertListener`: Synthesizes an alert chime using the browser's native Web Audio API (`AudioContext`) without external MP3 asset dependencies.
2. `TabTitleBadgeListener`: Updates the document title with the unread email count (e.g., `(1) New Email | TryMail`) and restores the default title upon inspection.
3. `ToastNotificationListener`: Dispatches UI toast notifications with sender and subject preview.

### Rationale
- Allows independent components to react to new incoming emails without knowing about the polling mechanism or each other.
- Conforms to Open/Closed Principle: new listeners (e.g., desktop browser push notifications, webhook dispatch) can be plugged in without modifying the core polling engine.

### Alternatives Considered
- *React Context API state triggers*: Rejected for notification routing because re-rendering entire component trees for audio playback causes unnecessary DOM updates and sound stuttering.
- *Window CustomEvent API*: Usable, but a dedicated typed TypeScript observer provides strict compile-time payload checking and aligns with course requirements.

---

## 4. Email HTML Sanitization & XSS Defense

### Decision
Employ `dompurify` (DOMPurify) to sanitize all incoming email HTML bodies prior to rendering.
Configure DOMPurify to:
- Strip `<script>`, `<iframe>`, `<object>`, `<embed>`, `<form>`, and inline `on*` event handlers.
- Enforce `target="_blank" rel="noopener noreferrer"` on all hyperlinks (`<a>` tags) via a DOMPurify post-processing hook.
- Fall back to plain-text rendering with URL regex autolinking if HTML is empty or invalid.

### Rationale
- Disposable emails routinely receive third-party verification emails containing rich HTML, images, and buttons. Rendering unsanitized HTML via `dangerouslySetInnerHTML` poses severe XSS risks.
- DOMPurify is the gold standard for browser-side DOM sanitization, thoroughly audited and fast (<5ms for typical email bodies).

### Alternatives Considered
- *Sandboxed iframe (`<iframe sandbox>`)*: Strong isolation, but creates severe styling, responsive layout, dynamic height calculation, and mobile viewport challenges.
- *Plain Text Only Viewer*: 100% secure, but breaks verification links embedded in HTML buttons and creates a poor user experience for modern registration emails.

---

## 5. Polling & Server-State Synchronization

### Decision
Adopt **TanStack Query (React Query v5)** for inbox synchronization:
- Set query key to `['inbox', activeMailbox?.id]`.
- Configure `refetchInterval: 5000` (5 seconds) with automatic pausing when the browser tab is unfocused or offline (`refetchIntervalInBackground: false`).
- Utilize TanStack Query's structural sharing and caching to prevent unnecessary re-renders when no new emails have arrived.
- Trigger `MailEventManager.notify('EMAIL_RECEIVED', newEmails)` inside a side-effect subscriber when new message IDs are detected.

### Rationale
- Avoids memory leaks, race conditions, and unmounted component state updates associated with manual `setInterval` in `useEffect`.
- Fulfills the project's React Development Best Practice rule regarding server state management.

### Alternatives Considered
- *Manual `setInterval` inside `useEffect`*: Highly prone to timer leaks, stale closures, duplicate requests on re-render, and difficult error back-off.
- *WebSockets / Server-Sent Events (SSE)*: Mail.tm supports SSE (Mercure hub), but 1secmail and mock engines do not. Polling provides a uniform baseline across all adapters, with SSE as an optional progressive enhancement.

