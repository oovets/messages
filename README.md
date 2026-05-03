# Messages

Messages is a desktop-first chat client for BlueBubbles/iMessage servers.
It is built with React, TypeScript, Vite, Tailwind CSS, Zustand, and Tauri 2.
The web UI can run in a browser during development, while the intended product
surface is the macOS desktop app.

The app focuses on a lightweight native-feeling messaging experience:

- Chat list, multi-pane conversations, message history, sending, replies, and tapbacks.
- Image, video, and file attachments, including full-size image preview dialogs.
- Rich link previews fetched locally in the desktop app.
- Desktop notifications for incoming messages.
- macOS Keychain-backed credential storage in release builds.
- Launch-at-login, tray menu, native menu, and `messages://` deep links.
- App-wide appearance controls, theme color editing, and `Cmd +`, `Cmd -`, `Cmd 0` font scaling.

## Current Status

The current app version is `0.1.3`.

macOS releases are built by GitHub Actions from `v*` tags. The workflow builds:

- Apple Silicon: `aarch64-apple-darwin` on `macos-latest`
- Intel: `x86_64-apple-darwin` on `macos-13`

Release builds are currently unsigned unless Apple signing and notarization
secrets are added to the repository.

## Requirements

For frontend development:

- Node.js 24
- npm

For desktop development:

- Rust stable
- Tauri 2 prerequisites for macOS
- Xcode command line tools

For app usage:

- A reachable BlueBubbles server
- The BlueBubbles server URL
- The BlueBubbles server password/API key

## Quick Start

Install dependencies:

```bash
npm install --legacy-peer-deps
```

Run the web app only:

```bash
npm run dev
```

Run the macOS desktop app in development:

```bash
npm run tauri:dev
```

Build the production frontend:

```bash
npm run build
```

Build local macOS desktop bundles:

```bash
npm run tauri:build
```

Generated local bundles are written under:

```text
src-tauri/target/release/bundle/
```

## First Run

When the app starts without saved settings, the Settings dialog opens
automatically. Enter:

- Server URL, for example `https://your-bluebubbles-server`
- Password/API key

In Tauri development mode, credentials are stored in local dev storage to avoid
repeated macOS Keychain trust prompts from unsigned dev binaries.

In macOS release builds, credentials are stored as a single JSON entry in
macOS Keychain under the service:

```text
com.oovets.messages
```

## Scripts

```bash
npm run dev          # Start Vite dev server
npm run build        # Type-check and build the frontend
npm run lint         # Run ESLint flat config
npm run preview      # Preview the built frontend
npm run tauri:dev    # Run the desktop app in development
npm run tauri:build  # Build local desktop bundles
```

## Desktop Features

### Secure Settings

Settings are managed through `src/lib/secureConfig.ts` and native Tauri commands
in `src-tauri/src/lib.rs`.

- Web runtime keeps credentials in memory only.
- Tauri dev uses local dev storage.
- macOS release builds use Keychain.
- Clearing settings removes the current Keychain entry and legacy split entries.

### Realtime and Fallback Sync

The app connects to the BlueBubbles Socket.IO-compatible websocket endpoint for
realtime updates. If realtime cannot be used, the app falls back to HTTP polling.

Relevant files:

- `src/hooks/useWebSocket.ts`
- `src/hooks/usePollingFallback.ts`
- `src/api/client.ts`

### Messages and Attachments

Messages are cached in Zustand and merged with incoming websocket/polling data.
Outgoing messages render optimistically and are deduplicated against server echoes
using temporary GUIDs and message metadata.

Image attachments render inline in chat bubbles. Clicking an image preview opens
a dark full-size dialog. Video attachments render as native `<video controls>`.
Other attachments are shown as links.

Relevant files:

- `src/components/MessageList.tsx`
- `src/components/MessageBubble.tsx`
- `src/components/MessageInput.tsx`
- `src/store/useAppStore.ts`

### Link Previews

When enabled, the desktop app fetches link metadata locally through the Tauri HTTP
plugin. Preview metadata is cached in Zustand with a bounded cache size.

Relevant files:

- `src/lib/linkPreview.ts`
- `src/components/LinkPreviewCard.tsx`
- `src/components/MessageBubble.tsx`
- `src/store/useAppStore.ts`

### Appearance

The app supports:

- Light/dark theme switching
- Superlight UI mode
- App-wide font scaling with `Cmd +`, `Cmd -`, and `Cmd 0`
- Font family editing
- Light and dark color token editing
- Auto-hidden scrollbars

Relevant files:

- `src/lib/appearance.ts`
- `src/components/SettingsDialog.tsx`
- `src/components/ThemeProvider.tsx`
- `src/index.css`

### macOS Integration

The Tauri app includes:

- Native menu actions
- Tray actions
- Launch at login
- Desktop notifications
- Deep links with the `messages://` scheme

Deep links can select a chat by using either:

```text
messages://chat/<chat-guid>
messages://open?chat=<chat-guid>
```

## Project Structure

```text
.
├── .github/workflows/          # GitHub Actions release workflow
├── src/                        # React application
│   ├── api/                    # BlueBubbles API client
│   ├── components/             # UI and chat components
│   ├── hooks/                  # Realtime, polling, and desktop hooks
│   ├── lib/                    # Utilities, appearance, secure config, previews
│   ├── store/                  # Zustand app state
│   └── types/                  # Shared TypeScript types
├── src-tauri/                  # Tauri 2 desktop shell
│   ├── capabilities/           # Tauri permissions
│   ├── icons/                  # Bundle icons
│   └── src/                    # Rust commands and app bootstrap
├── eslint.config.js            # ESLint 9 flat config
├── package.json                # npm scripts and frontend deps
└── vite.config.ts              # Vite config
```

## Local Cross-Architecture Builds

On Apple Silicon, install the Intel Rust target:

```bash
rustup target add x86_64-apple-darwin
```

Build an Intel macOS bundle:

```bash
npm run tauri:build -- --target x86_64-apple-darwin --bundles app,dmg
```

Build an Apple Silicon macOS bundle:

```bash
npm run tauri:build -- --target aarch64-apple-darwin --bundles app,dmg
```

## Verification

Before shipping changes, run:

```bash
npm run lint
npm run build
cd src-tauri && cargo check
```

For desktop packaging changes, also run:

```bash
npm run tauri:build
```

## Troubleshooting

### Keychain Prompts in Development

Unsigned Tauri dev binaries can trigger repeated macOS Keychain trust prompts.
Development builds avoid Keychain and use local dev storage. Release builds use
Keychain.

### DMG Build Fails With `Resource busy`

If a temporary app copy is running from a mounted DMG volume, `hdiutil detach`
can fail. Quit the temporary app process, eject the temporary volume, and rerun:

```bash
npm run tauri:build
```

### Self-Signed BlueBubbles Server Certificate

If the server uses a self-signed certificate, open the server URL directly in the
browser first and accept the certificate before using the app.

### Unsigned macOS Release Warning

Unsigned builds may require manual approval in macOS Gatekeeper. Add Apple
signing and notarization secrets to GitHub Actions before distributing to users
outside development/testing.
