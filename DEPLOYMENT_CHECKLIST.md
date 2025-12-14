# Render Deployment Checklist

Use this checklist to ensure everything is properly configured for Render deployment.

## Pre-Deployment

- [x] Settings model created
- [x] Settings API routes (public and admin)
- [x] Settings page in admin portal
- [x] Frontend apps updated to use settings for polling
- [x] MongoDB connection string configured
- [x] Render deployment documentation created
- [x] render.yaml configuration file created

## Backend Service Configuration

- [ ] Create Web Service in Render
- [ ] Set name: `espro-self-order-backend`
- [ ] Set build command: `cd backend && npm install`
- [ ] Set start command: `cd backend && node src/server.js`
- [ ] Set health check path: `/api/health`
- [ ] Add environment variables:
  - [ ] `NODE_ENV=production`
  - [ ] `PORT=10000`
  - [ ] `MONGODB_URI=mongodb+srv://espro-user:espro-user@espro-self-order.mbfu3a7.mongodb.net/?appName=espro-self-order`
  - [ ] `JWT_SECRET=<generate strong random secret>`
  - [ ] `ENABLE_WEBSOCKET=false`
  - [ ] `SOCKET_IO_PORT=8002`
  - [ ] `POLLING_INTERVAL=3000`
  - [ ] `CORS_ORIGINS=<update after deploying frontends>`

## Admin Portal Configuration

- [ ] Create Static Site in Render
- [ ] Set name: `espro-self-order-admin`
- [ ] Set build command: `cd apps/admin-portal && npm install && npm run build`
- [ ] Set publish directory: `apps/admin-portal/dist`
- [ ] Add environment variable:
  - [ ] `VITE_API_URL=https://espro-self-order-backend.onrender.com/api`

## Self-Order Portal Configuration

- [ ] Create Static Site in Render
- [ ] Set name: `espro-self-order-portal`
- [ ] Set build command: `cd apps/self-order-portal && npm install && npm run build`
- [ ] Set publish directory: `apps/self-order-portal/dist`
- [ ] Add environment variable:
  - [ ] `VITE_API_URL=https://espro-self-order-backend.onrender.com/api`

## Barista Portal Configuration

- [ ] Create Static Site in Render
- [ ] Set name: `espro-self-order-barista`
- [ ] Set build command: `cd apps/barista-portal && npm install && npm run build`
- [ ] Set publish directory: `apps/barista-portal/dist`
- [ ] Add environment variable:
  - [ ] `VITE_API_URL=https://espro-self-order-backend.onrender.com/api`

## Post-Deployment

- [ ] Update `CORS_ORIGINS` in backend with actual Render URLs
- [ ] Seed admin user: Run `node src/scripts/seedAdmin.js` via Render Shell
- [ ] Seed barista user: Run `node src/scripts/seedBarista.js` via Render Shell
- [ ] Seed settings: Run `node src/scripts/seedSettings.js` via Render Shell (or will auto-create)
- [ ] Test admin portal login
- [ ] Test barista portal login
- [ ] Test self-order portal QR scan flow
- [ ] Verify settings page works in admin portal
- [ ] Test polling can be enabled/disabled via settings
- [ ] Test WebSocket toggle (requires server restart)

## MongoDB Atlas Configuration

- [ ] Whitelist Render IP ranges in MongoDB Atlas Network Access
- [ ] Verify database connection works
- [ ] Test database operations

## Testing Checklist

- [ ] Admin can create tables and generate QR codes
- [ ] Admin can manage menu items
- [ ] Admin can create billing groups
- [ ] Admin can view bills (summary and detailed)
- [ ] Admin can close billing groups
- [ ] Admin can configure settings (WebSocket, polling)
- [ ] Customer can scan QR code and browse menu
- [ ] Customer can place orders
- [ ] Customer can view order status
- [ ] Customer can view order history
- [ ] Barista can view active orders
- [ ] Barista can update order/item statuses
- [ ] Polling respects settings configuration
- [ ] Orders are not duplicated (idempotency works)

## Production Considerations

- [ ] Upgrade to Starter plan or higher (free tier spins down)
- [ ] Configure custom domains (optional)
- [ ] Set up monitoring and alerts
- [ ] Configure MongoDB Atlas backups
- [ ] Consider cloud storage for QR codes (currently ephemeral)
- [ ] Review security settings
- [ ] Set up error tracking (optional)

## Notes

- QR codes stored in `backend/uploads/qrcodes/` are ephemeral on Render
- Consider migrating to cloud storage (S3, Cloudinary) for production
- Free tier services spin down after 15 minutes of inactivity
- WebSocket changes require server restart to take effect
- Settings are automatically initialized on first server start
