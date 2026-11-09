# Feature Specification: Temporary Disposable Email Service (Temp Mail)

**Feature Branch**: `001-temp-mail-service`

**Created**: 2026-11-09

**Status**: Ready for Planning

**Input**: User description: "Rancang Bangun Aplikasi Web Disposable Email (Temp Mail) dengan Penerapan Pola Desain Adapter, Facade, dan Observer Berbasis React.js"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Instant Mailbox Generation & One-Click Copy (Priority: P1)

As a privacy-conscious web user, I want to obtain a temporary disposable email address immediately upon visiting the application and copy it with a single click, so that I can use it to register for third-party services without exposing my personal email.

**Why this priority**: This is the core entry point of the entire application. Without the ability to acquire and copy a temporary address instantly, no subsequent user journeys can occur.

**Independent Test**: Can be tested independently by loading the application, verifying an active email address is displayed within seconds, and verifying that clicking the copy action places the exact address into the user's system clipboard.

**Acceptance Scenarios**:

1. **Given** the user navigates to the application, **When** the page finishes initial loading, **Then** an active temporary email address with an available domain is generated and displayed prominently.
2. **Given** an active temporary email address is displayed, **When** the user activates the copy button, **Then** the full address is copied to the clipboard and visual confirmation (e.g., "Copied!") is shown for 2 seconds.

---

### User Story 2 - Real-time Incoming Message Reception & Notification (Priority: P1)

As an active mailbox holder, I want new incoming emails to appear automatically in my inbox without manually reloading the entire page, accompanied by audio and visual alerts, so that I never miss verification codes or confirmation links.

**Why this priority**: Timely reception of verification emails is critical for temporary email usage. Manual page refreshes create friction and can lose session context.

**Independent Test**: Can be tested independently by sending an email from an external sender to the generated temporary address and observing that the message appears in the inbox list within the expected polling window while triggering audio and badge notifications.

**Acceptance Scenarios**:

1. **Given** an active mailbox with zero messages, **When** a new message arrives at the temporary address, **Then** the inbox list updates to show the new message with sender name, subject, and time received.
2. **Given** the user is viewing the application or has the tab in the background, **When** an incoming message is detected, **Then** an audible chime alert plays and the browser tab title updates to reflect the unread message count.

---

### User Story 3 - Message Inspection & Safe Content Viewing (Priority: P2)

As a user receiving verification messages, I want to select an email from the inbox list to read its full details (sender address, timestamp, subject, and body text/HTML) in a secure viewer, so that I can copy activation codes or click verification links safely.

**Why this priority**: Users need to read message bodies to complete registration workflows, while remaining protected from potentially malicious embedded scripts.

**Independent Test**: Can be tested independently by selecting an incoming email containing both plain text and rich HTML, and verifying that the message viewer displays the sanitized content accurately.

**Acceptance Scenarios**:

1. **Given** one or more messages exist in the inbox, **When** the user selects a message from the list, **Then** the message detail panel opens displaying the full sender information, receipt timestamp, subject line, and formatted body content.
2. **Given** an email containing HTML formatting or external links, **When** displayed in the detail panel, **Then** malicious scripts are stripped out and links open safely in external windows.

---

### User Story 4 - Mailbox Lifecycle Controls (Refresh, Reset, Delete) (Priority: P2)

As a user who has finished a task or wants a fresh start, I want explicit controls to manually check for new messages, generate a brand new address, or delete the current mailbox and its messages immediately.

**Why this priority**: Gives users full autonomy over their temporary identities, essential for privacy and testing multiple signups.

**Independent Test**: Can be tested independently by triggering manual refresh to verify immediate inbox check, and triggering the delete/renew action to verify the old address is discarded and a new one is assigned.

**Acceptance Scenarios**:

1. **Given** an active mailbox, **When** the user clicks the manual refresh control, **Then** an immediate synchronization check runs and the last-synced timestamp is updated.
2. **Given** an active mailbox with messages, **When** the user confirms a "New Address" or "Delete" action, **Then** the existing mailbox session is terminated, previous messages are cleared, and a fresh temporary address is generated.

---

### User Story 5 - Multi-Provider Mailbox Fallback & Switching (Priority: P3)

As a user experiencing third-party email provider outages or blocked domains, I want the ability to switch the underlying email service provider (or test with a simulated provider), so that I can continue receiving emails without interruption.

**Why this priority**: Public temporary mail APIs frequently suffer rate limits or domain blacklisting. Multi-provider switching ensures high availability and reliable offline demonstration.

**Independent Test**: Can be tested independently by changing the provider selector in settings, verifying that a new mailbox is created using the selected provider's domain pool, and testing message simulation in offline/mock mode.

**Acceptance Scenarios**:

1. **Given** an active session, **When** the user selects an alternative provider from the provider selector, **Then** the system switches the active mailbox to the chosen provider and loads its corresponding available domains.
2. **Given** a simulated mock provider is selected, **When** the user clicks "Simulate Incoming Email", **Then** a test email with realistic verification content is injected into the inbox within 2 seconds.

---

### Edge Cases

- **Network Interruption**: When internet connectivity drops while polling for emails, the system must retain previously loaded messages, display a subtle connectivity warning banner, and automatically resume polling once connection is restored without resetting the mailbox address.
- **Provider API Outage / Rate Limit**: If a third-party email API returns an error or rate limit response (e.g., HTTP 429/503), the system must notify the user with a friendly suggestion to switch to an alternate provider rather than crashing or freezing.
- **High Volume Inbox**: If more than 50 emails are received in a single session, the inbox list must maintain smooth scrolling and responsive selection without performance degradation.
- **Empty / Malformed Email Body**: If an email has an empty subject line or corrupted body content, the system must display fallback placeholders (e.g., "(No Subject)") without crashing the viewer.
- **Session Expiration**: When a temporary mailbox reaches its provider-defined expiration window, the user must be informed with an option to create a fresh mailbox.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST automatically generate an active temporary email address upon initial application startup without requiring user authentication or credentials.
- **FR-002**: System MUST provide a one-click clipboard copy function with immediate visual feedback confirming the address was copied.
- **FR-003**: System MUST periodically synchronize and check for new incoming messages at a configurable interval (defaulting to 5 seconds).
- **FR-004**: System MUST allow users to trigger an immediate manual inbox synchronization check at any time.
- **FR-005**: System MUST display an incoming message list showing sender address/name, subject, receipt time, and unread indicator.
- **FR-006**: System MUST trigger an audible sound chime and visual badge alert whenever a new incoming email is detected.
- **FR-007**: System MUST update the browser tab title dynamically with the count of unread incoming messages.
- **FR-008**: System MUST render full email details upon message selection, including sender, date, subject, plain text body, and sanitized rich HTML body.
- **FR-009**: System MUST sanitize all email body content to eliminate executable script tags, malicious iframe elements, and cross-site scripting attack vectors before rendering.
- **FR-010**: System MUST allow users to discard their current temporary email and generate a new address on demand.
- **FR-011**: System MUST support multiple email provider backends (including at least one live public API and one offline mock simulation engine).
- **FR-012**: System MUST persist the current active mailbox session across page reloads within the same browser session so users do not accidentally lose pending verification emails.

### Key Entities

- **TemporaryMailbox**: Represents the ephemeral email account currently held by the user. Attributes include `id`, `address`, `domain`, `createdAt`, `expiresAt`, `providerId`, and `status` (active, expired).
- **IncomingEmail**: Represents an individual message received within a mailbox. Attributes include `id`, `mailboxId`, `senderAddress`, `senderName`, `subject`, `receivedAt`, `textContent`, `htmlContent`, `isRead`, and optional `attachments`.
- **MailProvider**: Represents a supported temporary email service backend. Attributes include `id`, `name`, `domainsList`, `supportsRealtime`, and `isAvailable`.
- **NotificationEvent**: Represents a system notification emitted when messages arrive. Attributes include `eventType` (email received, mailbox expired, sync error), `payload`, and `emittedAt`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users obtain an active, fully functional temporary email address within 3 seconds of opening the application.
- **SC-002**: Incoming emails sent to the temporary address appear in the user interface within 5 seconds of being processed by the backing provider.
- **SC-003**: 100% of incoming emails with HTML content are safely sanitized with zero script execution in the host environment.
- **SC-004**: Users can complete the end-to-end task (receive email, open message, copy verification code) in under 15 seconds.
- **SC-005**: Switching between email providers or switching to the offline simulation provider completes in under 2 seconds without requiring a full application restart.
- **SC-006**: Application maintains continuous message monitoring during a user session with zero unhandled runtime crashes or memory leaks over extended operation (30+ minutes).

## Assumptions

- **Target Environment**: The application runs in modern desktop and mobile web browsers with JavaScript and standard web audio APIs enabled.
- **Scope Boundary (Receive Only)**: In accordance with industry standards for disposable email systems and anti-spam ethics, the system is strictly receive-only; composing and sending outgoing emails is out of scope.
- **Session Duration**: Temporary email sessions are ephemeral and intended for short-term verification tasks (typically 10 minutes to 1 hour), after which addresses may expire naturally on the provider backend.
- **Third-Party Availability**: Public temporary mail APIs may impose rate limits or experience downtime; therefore, a local mock provider is included to guarantee 100% reliable evaluation and demonstration regardless of external internet conditions.
