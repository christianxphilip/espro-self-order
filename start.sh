#!/bin/bash

echo "🚀 Starting ESPRO Self Order POS System..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

# Check if .env file exists
if [ ! -f "backend/.env" ]; then
    echo "📝 Creating .env file from .env.example..."
    cp backend/.env.example backend/.env
    echo "⚠️  Please edit backend/.env with your configuration before starting."
fi

echo "🐳 Starting Docker containers..."
docker-compose up --build -d

echo ""
echo "✅ Services are starting..."
echo ""
echo "📱 Access points:"
echo "   - Self-Order Portal: http://localhost:8084"
echo "   - Barista Portal: http://localhost:8085"
echo "   - Admin Portal: http://localhost:8086"
echo "   - Backend API: http://localhost:6000"
echo "   - MongoDB: localhost:27021"
echo ""
echo "📋 Next steps:"
echo "   1. Seed default users and sample data:"
echo "      docker-compose exec backend npm run seed"
echo "   2. Or seed specific users:"
echo "      docker-compose exec backend npm run seed:admin  # Admin + Barista"
echo "      docker-compose exec backend npm run seed:barista # Barista only"
echo "   3. Default credentials:"
echo "      Admin:"
echo "        Email: admin@gmail.com"
echo "        Password: admin123"
echo "      Barista:"
echo "        Email: barista@espro.com"
echo "        Password: barista123"
echo "   4. Login to Admin Portal at http://localhost:8086"
echo "   5. Create a billing group and activate it"
echo "   6. QR codes are auto-generated when tables are created"
echo ""
echo "📊 View logs: docker-compose logs -f"
echo "🛑 Stop services: docker-compose down"
