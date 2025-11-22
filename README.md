# StockMaster IMS

A modern inventory management system built with React and TypeScript for tracking products, stock movements, and warehouse operations.

## Features

### Product Management
- Track products with SKU, category, UOM, and cost
- Multi-location stock tracking (WH/Stock, WH/Showroom, WH/Packing, etc.)
- Low stock alerts and minimum stock level monitoring
- Support for different tracking strategies (No Tracking, By Lots, By Serial Number)
- QR code scanning support for product identification

### Stock Operations
- **Incoming Receipts** - Receive products from vendors
- **Delivery Orders** - Ship products to customers
- **Internal Transfers** - Move stock between warehouse locations
- **Inventory Adjustments** - Adjust stock levels
- Operation status tracking (Draft, Waiting, Ready, Done, Cancelled)
- Late delivery and receipt monitoring

### Dashboard & Analytics
- Real-time KPI metrics
- Low stock item tracking
- Late receipts and deliveries monitoring
- Visual charts using Recharts
- Stock ledger with complete transaction history

### Authentication
- Secure login system with user authentication
- Protected routes and session management

## Tech Stack

- **Frontend**: React 19.2.0 with TypeScript
- **Build Tool**: Vite 6.2.0
- **UI Components**: Lucide React icons
- **Charts**: Recharts 3.4.1
- **QR Code**: html5-qrcode 2.3.8

## Getting Started

### Prerequisites
- Node.js (v16 or higher)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/dhairy345/stockmaster-odoo.git
   cd stockmaster-odoo
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

5. Preview production build:
   ```bash
   npm run preview
   ```

## Project Structure

```
├── components/       # Reusable UI components
├── context/         # React context providers (Auth, Inventory)
├── lib/             # Utility functions and helpers
├── pages/           # Main application pages
│   ├── Dashboard.tsx
│   ├── Products.tsx
│   ├── Operations.tsx
│   ├── StockLedger.tsx
│   ├── Settings.tsx
│   └── Login.tsx
├── types.ts         # TypeScript type definitions
├── constants.ts     # Initial data and constants
└── App.tsx          # Main application component
```

## Key Concepts

### Operation Types
- **Receipt**: Incoming stock from vendors
- **Delivery**: Outgoing stock to customers
- **Internal Transfer**: Movement between warehouse locations
- **Adjustment**: Stock level corrections

### Tracking Strategies
- **No Tracking**: Simple quantity tracking
- **By Lots**: Track products in batches
- **By Serial Number**: Track individual items with unique identifiers

### Warehouse Locations
- WH/Stock, WH/Input, WH/Output
- WH/Packing, WH/Showroom, WH/Production
- Vendor, Customer, Scrap, Inventory Adjustment

## License

Private project
