# ESPRO Self Order POS - Setup Guide

## Initial Setup

### 1. Environment Configuration

Copy the example environment file:
```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your configuration.

### 2. Start Services

Using Docker (Recommended):
```bash
./start.sh
```

Or manually:
```bash
docker-compose up --build
```

### 3. Create Admin User

After services are running, seed the default admin user:

**Option 1: Seed admin only**
```bash
docker-compose exec backend npm run seed:admin
```

**Option 2: Seed admin + sample data (tables, menu items)**
```bash
docker-compose exec backend npm run seed
```

**Default Credentials:**
- **Admin:**
  - Email: `admin@gmail.com`
  - Password: `admin123`
- **Barista:**
  - Email: `barista@espro.com`
  - Password: `barista123`

**Or create via API:**
```bash
curl -X POST http://localhost:6000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@gmail.com",
    "password": "admin123",
    "name": "Admin",
    "isAdmin": true
  }'
```

**Note:** If you ran `npm run seed` or `npm run seed:admin`, the barista user is already created. You can skip step 4.

### 4. Create Barista User (Optional - if not using seed scripts)

```bash
curl -X POST http://localhost:6000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "barista@espro.com",
    "password": "barista123",
    "name": "Barista",
    "isBarista": true
  }'
```

**Note:** If you ran `npm run seed`, sample tables and menu items are already created. You can skip steps 5-6.

### 5. Create Tables

Login to barista portal or use API with admin token:

```bash
# Get token from login
TOKEN="your-jwt-token"

# Create a table
curl -X POST http://localhost:6000/api/tables \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "tableNumber": "Table 1",
    "location": "Indoor"
  }'
```

### 6. Create Menu Items

```bash
curl -X POST http://localhost:6000/api/menu \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Espresso",
    "description": "Classic espresso shot",
    "category": "Beverages",
    "price": 120,
    "isAvailable": true
  }'
```

### 7. Create Billing Group (Event)

```bash
curl -X POST http://localhost:6000/api/billing-groups \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Company Event 2024",
    "startDate": "2024-01-15T00:00:00Z"
  }'
```

### 8. Activate Billing Group

```bash
BILLING_GROUP_ID="your-billing-group-id"

curl -X PUT http://localhost:6000/api/billing-groups/$BILLING_GROUP_ID/activate \
  -H "Authorization: Bearer $TOKEN"
```

## Testing the Flow

1. **Get QR Code**: After creating a table, the QR code URL will be in the response
2. **Scan QR Code**: Use the self-order portal URL: `http://localhost:8084/scan/{qrCode}`
3. **Place Order**: Browse menu, add items, enter name, confirm order
4. **Barista View**: Login to barista portal at `http://localhost:8085` to see orders
5. **View Bills**: Use admin API to view bill summary and detailed bills

## API Testing

### Get Active Billing Group
```bash
curl http://localhost:6000/api/billing-groups/active/current
```

### Get Bill Summary
```bash
curl http://localhost:6000/api/bills/summary/$BILLING_GROUP_ID \
  -H "Authorization: Bearer $TOKEN"
```

### Get Detailed Bill
```bash
curl http://localhost:6000/api/bills/detailed/$BILLING_GROUP_ID \
  -H "Authorization: Bearer $TOKEN"
```

## Troubleshooting

### MongoDB Connection Issues
- Check if MongoDB container is running: `docker-compose ps`
- Check MongoDB logs: `docker-compose logs mongodb`

### Backend Not Starting
- Check backend logs: `docker-compose logs backend`
- Verify .env file exists and has correct values
- Check if port 6000 is available

### Frontend Not Loading
- Check if backend is running: `curl http://localhost:6000/api/health`
- Check browser console for errors
- Verify CORS settings in backend/.env

### QR Code Not Generating
- Check if uploads directory exists: `backend/uploads/qrcodes`
- Verify QR_CODE_UPLOAD_PATH in .env
- Check backend logs for QR code generation errors
