# SwiftConnect Logistics & Fleet Terminal

SwiftConnect is a modern, full-stack logistics management platform built for speed, transparency, and operational efficiency. It provides real-time tracking, fleet telemetry, inventory management, and financial reporting in a unified terminal interface.

## 🚀 Key Features
- **Real-time Dashboard**: Live statistics computed from a database including On-Time Delivery (OTD) rates and active shipments.
- **Fleet Control**: Dynamic telemetry map with vehicle health monitoring and diagnostic tools.
- **Intelligent Shipments**: Full lifecycle tracking from creation to driver assignment and final delivery.
- **Inventory Matrix**: SKU tracking with location-based stock management.
- **Role-Based Access**: Specialized views for Administrators, Coordinators, and Drivers.
- **Financial Module**: Expense tracking and revenue visualization.

## 🛠 Tech Stack
- **Frontend**: React 18 (Vite), Tailwind CSS, Lucide Icons, Framer Motion, Recharts.
- **Backend**: Node.js (Express), SQLite (better-sqlite3).
- **Authentication**: Custom JWT-ready context with session persistence.
- **Database**: Relational SQLite schema with audit logging.

## 📥 Local Setup

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd swiftconnect
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   The terminal will be accessible at `http://localhost:3000`.

## 🏗 Deployment
This application is designed to be deployed using **Docker** or standard **Node.js hosting**. 

- The backend serves the static frontend files from the `dist/` directory in production mode.
- Ensure the `database.sqlite` file has write permissions in your deployment environment.

## 📜 License
MIT License - feel free to use for personal or commercial projects.
