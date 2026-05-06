# SwiftConnect Applet Context

This file contains persistent instructions and project context for the AI agent.

## Project Overview
SwiftConnect is a full-stack logistics and fleet management terminal.
- **Frontend**: React 18+ (Vite), Tailwind CSS, Lucide Icons, Framer Motion.
- **Backend**: Express.js server (`server.ts`) running on port 3000.
- **Database**: SQLite (`database.sqlite`) managed via `better-sqlite3`.

## Authentication System
- **Auth Strategy**: custom context-based authentication (`src/contexts/AuthContext.tsx`).
- **Session Persistence**: `localStorage` stores the user object as `auth_session`.
- **Hooks**: Use `useAuth` from `src/hooks/useAuth.ts` to access user state and actions.
- **UI Components**:
  - `TopNav.tsx`: Displays user info and "Log Out" button.
  - `Sidebar.tsx`: Main navigation.

## UI/UX Guidelines
- **Typography**: "Inter" for UI, "JetBrains Mono" for technical data.
- **Animations**: Use `motion` from `motion/react` for route transitions and interactive elements.
- **Color Palette**: 
  - Primary: Blue-600 (Logins/Primary Actions)
  - Secondary: Gray-900 (Sidebar/Terminal accents)
  - Feedback: Red-500 (Alerts/Destructive actions)

## Development Rules
- **Stay Full-Stack**: Always maintain the Express server (`server.ts`) for authentication and database operations.
- **API First**: Add new features by first creating the API route in `server.ts` and then implementing the frontend service/hook.
- **No Mocking**: Use the SQLite database for all data persistence.
- **Verification**: Always run `lint_applet` and `compile_applet` after changes.
