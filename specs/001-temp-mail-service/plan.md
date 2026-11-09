# Implementation Plan: Temporary Disposable Email Service (Temp Mail)

**Branch**: `001-temp-mail-service` | **Date**: 2026-11-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-temp-mail-service/spec.md`

## Summary

Build a modern, client-side Disposable Email (Temp Mail) web application powered by **React.js (TypeScript)** and **Tailwind CSS**, strictly implementing three foundational Gang of Four (GoF) design patterns:
1. **Adapter Pattern**: Unifies heterogeneous third-party email APIs (Mail.tm, 1secmail) alongside a local offline simulation provider under a common `ITempMailProvider` interface.
2. **Facade Pattern**: Orchestrates complex multi-step mailbox lifecycles (domain discovery, credential generation, auth tokens, background synchronization) behind an intuitive, high-level `TempMailFacade`.
3. **Observer Pattern**: Broadcasts asynchronous mailbox events (`EMAIL_RECEIVED`, `MAILBOX_EXPIRED`) to multiple decoupled subscribers (Web Audio chime, browser tab badge counter, toast notifications) without tightly coupling components.

## Technical Context

**Language/Version**: TypeScript 5.4+ / ECMAScript 2022

**Primary Dependencies**:
- `react` ($\ge 18.2.0$) & `react-dom`
- `vite` ($\ge 5.0.0$) as the build tool and development server
- `@tanstack/react-query` (v5) for robust server-state management and periodic polling
- `dompurify` ($\ge 3.0.0$) for comprehensive client-side HTML email body sanitization
- `lucide-react` for accessible UI iconography
- `clsx` & `tailwind-merge` for layout-agnostic component styling

**Storage**: Browser `sessionStorage` (under key `TRYMAIL_SESSION_V1`) for active mailbox persistence across browser tab refreshes with auto-purge upon deletion.

**Testing**: `vitest` + `@testing-library/react` for unit and contract testing of pattern classes and presentation hooks.

**Target Platform**: Modern Evergreen Web Browsers (Chrome, Edge, Firefox, Safari) with Web Audio API support.

**Project Type**: Single-Page Application (SPA / React Frontend Client).

**Performance Goals**:
- Initial application load < 2 seconds.
- Mailbox provisioning < 3 seconds.
- Incoming email polling latency < 5 seconds.
- Message inspection and sanitized rendering < 100 milliseconds.

**Constraints**:
- Strict client-side SPA (no custom server backend needed for initial evaluation; consumes public CORS-enabled endpoints + offline mock engine).
- Zero XSS vulnerability: all HTML email bodies sanitized via DOMPurify before rendering.
- No `any` types; 100% strict TypeScript typing.

**Scale/Scope**:
- Multi-provider support (Mail.tm, 1secmail, MockMail).
- Inboxes capable of displaying 50+ received emails with smooth scrolling.
- 3 formal GoF patterns with corresponding architectural contracts.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle / Rule | Compliance Status | Justification / Implementation Detail |
| :--- | :---: | :--- |
| **I. Clean Architecture & Separation of Concerns** | **PASS** | Pattern services reside in `/src/services/` (pure TS classes without React DOM dependencies). UI components in `/src/components/` are presentational/dumb. Hooks in `/src/hooks/` serve as reactive bridges. |
| **II. Design Pattern Fidelity (Adapter, Facade, Observer)** | **PASS** | `ITempMailProvider` (Adapter Target), `TempMailFacade` (Facade), and `MailEventManager` (Observer Subject) explicitly implement standard GoF roles and contracts. |
| **III. TypeScript-First & Strict Type Safety** | **PASS** | No `any` types used. All entities, props, provider responses, and event payloads are strongly typed in `/src/types/` and `/src/services/`. |
| **IV. Deterministic & Testable Multi-Provider Support** | **PASS** | Built-in `MockMailAdapter` guarantees 100% reliable evaluation, testing, and live presentation independent of external internet availability. |
| **V. Security & Safe Content Rendering** | **PASS** | `dompurify` neutralizes executable scripts and malicious tags. External links strictly enforce `target="_blank" rel="noopener noreferrer"`. |
| **React Standard: Centralized Constants** | **PASS** | Fixed endpoints, polling intervals, and default settings are centralized in `/src/library/constants.ts`. |
| **React Standard: Server State via TanStack Query** | **PASS** | TanStack Query v5 manages polling intervals and caching; no ad-hoc `setInterval` loops inside `useEffect`. |
| **React Standard: Layout-Agnostic Components** | **PASS** | Components omit outer margins and merge custom classes via `clsx` and `tailwind-merge`. |

## Project Structure

### Documentation (this feature)

```text
specs/001-temp-mail-service/
├── plan.md              # This file (/speckit-plan output)
├── research.md          # Phase 0 architectural decisions
├── data-model.md        # Phase 1 domain entities & state machines
├── quickstart.md        # Phase 1 runnable validation scenarios
├── contracts/           # Phase 1 pattern interface contracts
│   ├── provider-adapter.contract.ts
│   ├── facade.contract.ts
│   └── observer.contract.ts
└── checklists/
    └── requirements.md  # Specification quality checklist
```

### Source Code Layout (repository root)

```text
src/
├── library/
│   └── constants.ts                 # Centralized configuration (no magic strings)
├── types/
│   ├── mailbox.types.ts             # TemporaryMailbox, ProviderType
│   ├── email.types.ts               # IncomingEmail, EmailAttachment
│   └── observer.types.ts            # MailEventType, MailEventMap
├── services/                        # PURE DESIGN PATTERN CLASSES (No React DOM)
│   ├── adapter/
│   │   ├── ITempMailProvider.ts     # Adapter target interface
│   │   ├── MailTmAdapter.ts         # Concrete Adapter 1 (Mail.tm REST API)
│   │   ├── OneSecMailAdapter.ts     # Concrete Adapter 2 (1secmail API)
│   │   └── MockMailAdapter.ts       # Concrete Adapter 3 (Deterministic offline engine)
│   ├── facade/
│   │   └── TempMailFacade.ts        # Facade orchestrating multi-step lifecycle
│   └── observer/
│       ├── IMailEventListener.ts    # Observer subscriber contract
│       ├── MailEventManager.ts      # Observer publisher / subject
│       └── listeners/
│           ├── AudioAlertListener.ts       # Web Audio API chime generator
│           ├── TabTitleBadgeListener.ts    # Document title unread counter
│           └── ToastNotificationListener.ts# Toast event dispatcher
├── hooks/                           # REACT ADAPTER LAYER
│   ├── useTempMail.ts               # Bridge to Facade with TanStack Query polling
│   └── useMailObserver.ts           # Subscribes React lifecycle to MailEventManager
├── components/                      # DUMB PRESENTATIONAL UI COMPONENTS
│   ├── MailboxHeader.tsx            # Address display, copy button, provider picker
│   ├── InboxList.tsx                # Message list with unread badges
│   ├── EmailCard.tsx                # Single email summary row item
│   ├── EmailDetailModal.tsx         # Sanitized rich HTML message viewer
│   ├── ActionToolbar.tsx            # Refresh, generate new, and delete buttons
│   └── ToastContainer.tsx           # Floating toast notification stack
├── utils/
│   ├── sanitizer.ts                 # DOMPurify HTML sanitizer wrapper
│   └── formatters.ts                # Date and byte size formatters
├── App.tsx                          # Root application container & layout
└── main.tsx                         # QueryClientProvider & React entrypoint
```

**Structure Decision**: A clean single-project SPA architecture with strict folder separation (`/services`, `/hooks`, `/components`, `/library`, `/types`) ensures that GoF design pattern logic remains completely decoupled from React rendering cycles, fulfilling both academic evaluation standards and modern industry frontend best practices.

## Complexity Tracking

> *No constitutional violations detected. All design patterns serve verified functional requirements without overengineering.*
