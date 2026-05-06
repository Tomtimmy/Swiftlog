# SwiftConnect - Logistics & Fleet Terminal

SwiftConnect is a professional logistics management platform designed for tracking shipments, managing fleet operations, and revenue governance.

## Features

- **Dashboard**: Real-time overview of fleet metrics and delivery performance.
- **Shipments**: Comprehensive tracking system with status monitoring.
- **Task Management**: Kanban-style operations board for teams.
- **Fleet Monitoring**: IoT-ready vehicle telemetry and status tracking.
- **Responsive Design**: Built with Tailwind CSS and Framer Motion for a polished experience.

## Tech Stack

- **Frontend**: React 18, Vite, TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Database**: SQLite with `better-sqlite3` handled via an Express.js backend.
- **Reporting**: Advanced revenue analytics and SKU performance governance.

## Getting Started

1. Clone the repository.
2. Install dependencies: `npm install`
3. Run the development server: `npm run dev` (Starts both Vite and Express backend).

## Deployment

### Full-Stack (Recommended)
This app includes an Express server and SQLite database. For full functionality, deploy to a platform that supports Node.js (e.g., Cloud Run, Heroku, Railway).

### Static Frontend (GitHub Pages)
A GitHub Actions workflow is included in `.github/workflows/static.yml`. 
*Note: The frontend will be functional, but server-dependent features (API, Database) will require a hosted API endpoint.*
