# Render Deployment Guide

This guide will help you deploy the ESPRO Self-Order POS system to Render.

## Prerequisites

1. A Render account (sign up at https://render.com)
2. MongoDB Atlas account (already configured)
3. Git repository (GitHub, GitLab, or Bitbucket)

## Deployment Steps

### 1. Backend Service

1. Go to Render Dashboard → New → Web Service
2. Connect your repository
3. Configure the service:
   - **Name**: `espro-self-order-backend`
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && node src/server.js`
   - **Plan**: Starter ($7/month) or Free (with limitations)

4. Add Environment Variables:
   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=mongodb+srv://espro-user:espro-user@espro-self-order.mbfu3a7.mongodb.net/?appName=espro-self-order
   JWT_SECRET=<generate a strong random secret>
   ENABLE_WEBSOCKET=false
   SOCKET_IO_PORT=8002
   POLLING_INTERVAL=3000
   CORS_ORIGINS=https://espro-self-order-admin.onrender.com,https://espro-self-order-portal.onrender.com,https://espro-self-order-barista.onrender.com
   ```

5. Set Health Check Path: `/api/health`

### 2. Admin Portal (Static Site)

1. Go to Render Dashboard → New → Static Site
2. Connect your repository
3. Configure:
   - **Name**: `espro-self-order-admin`
   - **Build Command**: `cd apps/admin-portal && npm install && npm run build`
   - **Publish Directory**: `apps/admin-portal/dist`
   - **Environment Variable**:
     ```
     VITE_API_URL=https://espro-self-order-backend.onrender.com/api
     ```

### 3. Self-Order Portal (Static Site)

1. Go to Render Dashboard → New → Static Site
2. Connect your repository
3. Configure:
   - **Name**: `espro-self-order-portal`
   - **Build Command**: `cd apps/self-order-portal && npm install && npm run build`
   - **Publish Directory**: `apps/self-order-portal/dist`
   - **Environment Variable**:
     ```
     VITE_API_URL=https://espro-self-order-backend.onrender.com/api
     ```

### 4. Barista Portal (Static Site)

1. Go to Render Dashboard → New → Static Site
2. Connect your repository
3. Configure:
   - **Name**: `espro-self-order-barista`
   - **Build Command**: `cd apps/barista-portal && npm install && npm run build`
   - **Publish Directory**: `apps/barista-portal/dist`
   - **Environment Variable**:
     ```
     VITE_API_URL=https://espro-self-order-backend.onrender.com/api
     ```

## Post-Deployment Steps

### 1. Seed Initial Data

After the backend is deployed, you need to seed the database:

1. SSH into the backend service (if available) or use Render Shell
2. Run:
   ```bash
   cd backend
   node src/scripts/seedAdmin.js
   node src/scripts/seedBarista.js
   ```

Alternatively, you can create a one-time script that runs on first deployment.

### 2. Update CORS Origins

After all services are deployed, update the `CORS_ORIGINS` environment variable in the backend with the actual Render URLs:

```
CORS_ORIGINS=https://espro-self-order-admin.onrender.com,https://espro-self-order-portal.onrender.com,https://espro-self-order-barista.onrender.com
```

### 3. Access Your Services

- **Admin Portal**: `https://espro-self-order-admin.onrender.com`
- **Self-Order Portal**: `https://espro-self-order-portal.onrender.com`
- **Barista Portal**: `https://espro-self-order-barista.onrender.com`
- **Backend API**: `https://espro-self-order-backend.onrender.com`

### 4. Default Credentials

- **Admin**: `admin@gmail.com` / `admin123`
- **Barista**: `barista@espro.com` / `barista123`

## Important Notes

1. **Free Tier Limitations**:
   - Services spin down after 15 minutes of inactivity
   - First request after spin-down takes ~30 seconds
   - Consider upgrading to Starter plan for production

2. **File Uploads**:
   - QR codes are stored in `backend/uploads/qrcodes/`
   - On Render, these files are ephemeral (lost on redeploy)
   - Consider using a cloud storage service (AWS S3, Cloudinary) for production

3. **WebSocket**:
   - WebSocket requires a persistent connection
   - Free tier may have limitations
   - Consider using polling for free tier deployments

4. **Environment Variables**:
   - Keep `JWT_SECRET` secure and never commit it
   - Update `CORS_ORIGINS` with actual deployment URLs

5. **Database**:
   - MongoDB Atlas connection string is already configured
   - Ensure your MongoDB Atlas IP whitelist includes Render's IP ranges

## Troubleshooting

### Backend won't start
- Check environment variables are set correctly
- Verify MongoDB connection string
- Check build logs for errors

### Frontend can't connect to backend
- Verify `VITE_API_URL` is set correctly
- Check CORS settings in backend
- Ensure backend service is running

### Static files not loading
- Verify build completed successfully
- Check publish directory path
- Ensure environment variables are set during build

## Production Recommendations

1. **Upgrade Plans**: Use Starter or higher for production
2. **Custom Domains**: Configure custom domains for better UX
3. **SSL**: Render provides free SSL certificates
4. **Monitoring**: Set up health checks and alerts
5. **Backups**: Configure MongoDB Atlas backups
6. **File Storage**: Migrate to cloud storage for QR codes
7. **CDN**: Consider using a CDN for static assets
