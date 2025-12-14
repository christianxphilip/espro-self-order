# ESPRO Self Order POS System

A complete self-order POS system for events where customers scan QR codes at tables to browse menus, place orders, and have orders appear on barista screens for real-time fulfillment tracking. All orders are consolidated under billing groups with summary and detailed bill views.

## Features

### Customer Flow
- Scan QR code at table
- Browse menu by categories
- Add items to cart
- Enter name for order tracking
- Confirm and submit order
- View order status updates

### Barista Flow
- View incoming orders in real-time
- Mark orders/items as in-progress, completed, or dispatched
- Update individual item status within an order
- Dashboard with order statistics

### Manager/Admin Flow
- Create billing groups (events) with billing names
- Enable/disable self-service ordering
- Manage tables and QR codes
- Manage menu items
- View bill summary (total amount)
- View detailed bill (all orders with customer names)

## Tech Stack

- **Backend**: Node.js, Express, MongoDB, Mongoose
- **Frontend**: React, Vite, TailwindCSS, React Query
- **Real-time**: Socket.io (optional, feature toggle - defaults to polling)
- **QR Code**: QR code generation library

## Project Structure

```
espro-self-ordering/
├── backend/                # Express.js API server
│   ├── src/
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic services
│   │   ├── middleware/     # Auth middleware
│   │   └── config/         # Configuration
│   └── uploads/            # QR code images
├── apps/
│   ├── self-order-portal/  # Customer self-order interface
│   └── barista-portal/     # Barista order management
└── docker-compose.yml      # Docker orchestration
```

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for local development)
- MongoDB (or use Docker)

### Using Docker (Recommended)

1. **Clone or navigate to the project directory**
   ```bash
   cd espro-self-ordering
   ```

2. **Create environment file**
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your configuration
   ```

3. **Build and start all services**
   ```bash
   docker-compose up --build
   ```

4. **Access the applications**
   - Self-Order Portal: http://localhost:8084
   - Barista Portal: http://localhost:8085
   - **Admin Portal: http://localhost:8086** (Login with admin credentials)
   - Backend API: http://localhost:6000
   - MongoDB: localhost:27021

5. **Seed default admin user and sample data**
   ```bash
   docker-compose exec backend npm run seed
   ```
   
   Or seed admin only:
   ```bash
   docker-compose exec backend npm run seed:admin
   ```
   
   **Default Credentials:**
   - **Admin:**
     - Email: `admin@gmail.com`
     - Password: `admin123`
   - **Barista:**
     - Email: `barista@espro.com`
     - Password: `barista123`

### Local Development

1. **Install dependencies**
   ```bash
   cd backend && npm install
   cd ../apps/self-order-portal && npm install
   cd ../apps/barista-portal && npm install
   ```

2. **Set up MongoDB**
   - Use Docker: `docker run -d -p 27017:27017 mongo:7`
   - Or use a local MongoDB instance

3. **Configure environment**
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env
   ```

4. **Start backend**
   ```bash
   cd backend
   npm run dev
   ```

5. **Start self-order portal**
   ```bash
   cd apps/self-order-portal
   npm run dev
   ```

6. **Start barista portal**
   ```bash
   cd apps/barista-portal
   npm run dev
   ```

7. **Start admin portal**
   ```bash
   cd apps/admin-portal
   npm run dev
   ```

## Environment Variables

### Backend (.env)

```env
PORT=6000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/espro-self-ordering
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

FRONTEND_URL=http://localhost:5176
SELF_ORDER_URL=http://localhost:5176
BARISTA_URL=http://localhost:5177

CORS_ORIGINS=http://localhost:5176,http://localhost:5177

QR_CODE_BASE_URL=http://localhost:5176/order/table
QR_CODE_UPLOAD_PATH=./uploads/qrcodes

# WebSocket Feature Toggle (default: false - uses polling)
ENABLE_WEBSOCKET=false
SOCKET_IO_PORT=8002

# Polling Configuration
POLLING_INTERVAL=3000
```

## API Endpoints

### Public Endpoints
- `GET /api/tables/qr/:qrCode` - Get table by QR code
- `GET /api/menu` - Get all menu items
- `GET /api/menu/categories` - Get menu by categories
- `POST /api/orders` - Create new order
- `GET /api/orders/table/:tableId` - Get orders for a table
- `GET /api/billing-groups/active/current` - Get active billing group

### Protected Endpoints (Admin)
- `GET /api/tables` - List all tables
- `POST /api/tables` - Create table
- `PUT /api/tables/:id` - Update table
- `DELETE /api/tables/:id` - Delete table
- `GET /api/billing-groups` - List billing groups
- `POST /api/billing-groups` - Create billing group
- `PUT /api/billing-groups/:id/activate` - Enable self-service ordering
- `PUT /api/billing-groups/:id/deactivate` - Disable self-service ordering
- `GET /api/bills/summary/:billingGroupId` - Get bill summary
- `GET /api/bills/detailed/:billingGroupId` - Get detailed bill

### Protected Endpoints (Barista)
- `GET /api/barista/orders/pending` - Get pending orders
- `GET /api/barista/orders/active` - Get active orders
- `GET /api/barista/dashboard` - Get dashboard stats
- `PUT /api/barista/orders/:id/start` - Mark order as preparing
- `PUT /api/barista/orders/:id/complete` - Mark order as ready
- `PUT /api/barista/orders/:id/dispatch` - Mark order as dispatched
- `PUT /api/orders/:id/status` - Update order status
- `PUT /api/orders/:id/items/:itemId/status` - Update item status

## Workflow

### Event Setup
1. Manager creates a billing group with a billing name
2. Manager enables self-service ordering for the billing group
3. QR codes become active for ordering

### Customer Ordering
1. Customer scans QR code at table
2. System validates table and active billing group
3. Customer browses menu and adds items to cart
4. Customer enters name and confirms order
5. Order is created and linked to billing group

### Barista Fulfillment
1. Barista sees new orders on dashboard
2. Barista marks order as preparing
3. Barista updates item statuses as they're made
4. Barista marks order as ready, then dispatched

### Billing
1. Manager views bill summary (total amount)
2. Manager views detailed bill (all orders with customer names)
3. Manager can disable billing group to stop new orders

## Real-Time Updates

The system supports two modes:

1. **Polling (Default)**: Frontend polls API endpoints at configurable intervals
2. **WebSocket (Optional)**: Real-time updates via Socket.io (enable with `ENABLE_WEBSOCKET=true`)

## Database Models

- **Table**: Table information with QR codes
- **MenuItem**: Menu items with categories, pricing, availability
- **BillingGroup**: Event/billing groups with billing names
- **Order**: Customer orders with items and status
- **User**: Admin and barista users

## License

ISC
