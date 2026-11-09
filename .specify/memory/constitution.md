<!--
Sync Impact Report:
- Version change: 0.1.0-draft -> 1.0.0
- Modified principles:
  - [PRINCIPLE_1_NAME] -> I. Clean Architecture & Separation of Concerns
  - [PRINCIPLE_2_NAME] -> II. Design Pattern Fidelity (Adapter, Facade, Observer)
  - [PRINCIPLE_3_NAME] -> III. TypeScript-First & Strict Type Safety
  - [PRINCIPLE_4_NAME] -> IV. Deterministic & Testable Multi-Provider Support
  - [PRINCIPLE_5_NAME] -> V. Security & Safe Content Rendering
- Added sections:
  - [SECTION_2_NAME] -> React Development Standards & State Governance
  - [SECTION_3_NAME] -> Quality Gates & Verification
- Removed sections: None (all placeholder template slots concretized).
- Follow-up TODOs: None.
-->

# TryMail Project Constitution

## Core Principles

### I. Clean Architecture & Separation of Concerns
Business logic, design pattern implementations, state management hooks, and user interface components MUST remain strictly decoupled:
- Core design patterns (Adapter, Facade, Observer) MUST reside in `/src/services` or `/src/library` as framework-agnostic TypeScript classes and interfaces, completely independent of the React DOM.
- UI components in `/src/components` MUST function as dumb/presentational units that receive data via props and trigger actions via callbacks, containing zero direct business or network logic.
- Custom hooks in `/src/hooks` serve as the sole bridge between design pattern services and the React rendering lifecycle.

### II. Design Pattern Fidelity (Adapter, Facade, Observer)
Every implemented Gang of Four (GoF) design pattern MUST strictly follow its formal architectural contract and serve a justified purpose:
- **Adapter Pattern**: MUST normalize differing third-party temporary mail API schemas into a unified, interchangeable `ITempMailProvider` target interface.
- **Facade Pattern**: MUST encapsulate multi-step mailbox workflows (domain retrieval, credential creation, authentication token exchange, and polling startup) behind a simplified client-facing API (`TempMailFacade`).
- **Observer Pattern**: MUST decouple event generation (incoming email detection, mailbox expiration) from event consumption (audio alerts, tab title counter updates, toast notifications) using a centralized `MailEventManager`.

### III. TypeScript-First & Strict Type Safety
All code within the repository MUST strictly enforce type safety without exception:
- The use of `any` is strictly prohibited; all domain models (`TemporaryMailbox`, `IncomingEmail`), component props, provider responses, and event payloads MUST have explicit `interface` or `type` definitions.
- Runtime configurations and shared enumerations MUST be strongly typed.
- Type definitions MUST reside in dedicated `/src/types` or `/src/services` definition files to prevent circular dependencies.

### IV. Deterministic & Testable Multi-Provider Support
The system MUST guarantee high availability and testability independent of external network conditions:
- The application MUST provide a built-in offline mock provider (`MockMailAdapter`) alongside live public API adapters (e.g., Mail.tm, 1secmail).
- The mock provider MUST support instant message simulation to enable deterministic automated testing and offline evaluation.
- Switching providers at runtime MUST preserve application stability and avoid memory leaks from dangling intervals or event listeners.

### V. Security & Safe Content Rendering
Security and user privacy are non-negotiable requirements for disposable email handling:
- All received email bodies (HTML and rich text) MUST be thoroughly sanitized prior to rendering in the DOM to neutralize script execution, malicious event handlers, and cross-site scripting (XSS) vectors.
- Links within received messages MUST be configured to open safely in isolated external browsing contexts (`target="_blank" rel="noopener noreferrer"`).
- Temporary credentials and tokens stored in browser session storage MUST be automatically purged upon mailbox deletion or expiration.

## React Development Standards & State Governance

### 1. Centralized Constants
- Magic numbers, hardcoded API URLs, polling intervals, and fallback strings are prohibited inside components.
- All fixed application values MUST be extracted to `/src/library/constants.ts`.

### 2. State & Data Fetching Architecture
- **Server State**: Polling and server synchronization MUST utilize TanStack Query (React Query) to handle caching, background refetching, and loading/error states cleanly. Manual ad-hoc `useEffect` fetch loops are prohibited.
- **URL as Source of Truth**: Shareable UI states (such as active mailbox address and currently inspected email ID) MUST synchronize with URL query parameters where applicable.
- **Derived State**: Computed values (e.g., unread count, filtered messages) MUST be derived using `useMemo` rather than stored in redundant `useState` variables.
- **Functional Updates**: State transitions that depend on previous values MUST use functional state updater callbacks (`setCount(prev => prev + 1)`).

### 3. Component & Layout Agnosticism
- Presentational components MUST NOT define external positioning styles (such as outer `margin`). Layout spacing MUST be controlled by parent containers or through merged `className` props using `clsx` and `tailwind-merge`.
- Prop drilling MUST be avoided by leveraging the React `children` pattern or scoped context providers where appropriate.
- Multiple adjacent elements MUST be wrapped in React Fragments (`<>...</>`) rather than semantic-less container `div` elements.

## Quality Gates & Verification

### 1. Verification Gates
- **Static Analysis**: The codebase MUST compile cleanly via `tsc --noEmit` with zero type errors or unresolved imports.
- **Pattern Verification**: Every design pattern class MUST have corresponding unit tests verifying contract compliance (Adapter schema mapping, Facade orchestration, Observer event broadcast).
- **Security Check**: Email HTML sanitization routines MUST pass test cases containing malicious XSS payloads.

### 2. Review & Refactoring Standard
- Before introducing any new dependency or design pattern, the architectural justification MUST be documented in alignment with this Constitution.
- Dead code, commented-out debugging blocks, and temporary console logs MUST be removed prior to merging.

## Governance

This Constitution serves as the authoritative architectural and coding standard for the TryMail project. All feature specifications (`spec.md`), implementation plans (`plan.md`), task lists (`tasks.md`), and pull requests MUST strictly adhere to these principles.

1. **Amendment Procedure**: Any amendment or addition to this Constitution requires formal documentation, impact analysis, and a corresponding semantic version bump.
2. **Versioning Policy**:
   - **MAJOR**: Incompatible changes to core principles or foundational architecture.
   - **MINOR**: Addition of new architectural principles, patterns, or quality gates.
   - **PATCH**: Non-semantic clarifications, typographical corrections, or formatting updates.
3. **Compliance Review**: All downstream Spec Kit commands (`/speckit-plan`, `/speckit-tasks`, `/speckit-implement`) MUST validate proposed designs against these governance rules.

**Version**: 1.0.0 | **Ratified**: 2026-11-09 | **Last Amended**: 2026-11-09
