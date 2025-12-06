# 🚀 How to Run the Application

## Step-by-Step Guide

### Step 1: Verify Environment Files

Make sure you have:
- ✅ `backend/.env` - Backend environment variables
- ✅ `frontend/.env.local` - Frontend environment variables (or `.env`)

### Step 2: Install Dependencies

If you haven't already, install all dependencies:

```bash
# From the root directory
npm run install:all
```

Or install separately:

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### Step 3: Set Up Database

#### Option A: Using Docker (Recommended for Quick Start)

```bash
# Start PostgreSQL in Docker
docker-compose up -d postgres

# Wait a few seconds for PostgreSQL to start
```

#### Option B: Using Local PostgreSQL

Make sure PostgreSQL is running and create the database:

```bash
# Create database (if it doesn't exist)
createdb xeno_db

# Or using psql
psql -U postgres -c "CREATE DATABASE xeno_db;"
```

### Step 4: Run Database Migrations

This creates all the tables in your database:

```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

**What this does:**
- Creates all database tables (tenants, customers, orders, products, etc.)
- Generates Prisma Client for TypeScript

**Expected output:**
```
✔ Generated Prisma Client
✔ Applied migration
```

### Step 5: Start the Application

#### Option A: Run Both Servers Together (Recommended)

From the root directory:

```bash
npm run dev
```

This will start:
- Backend on http://localhost:3001
- Frontend on http://localhost:3000

#### Option B: Run Servers Separately

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Step 6: Access the Application

Once both servers are running:

1. **Open your browser** and go to: http://localhost:3000

2. **Register a new account:**
   - Click "Sign up" or "Don't have an account? Sign up"
   - Enter your email and password
   - Click "Sign up"

3. **Add a Shopify Store:**
   - After logging in, go to "Stores" in the navigation
   - Click "Add Store"
   - Fill in your Shopify store details:
     - Store Name
     - Store URL (e.g., `your-store.myshopify.com`)
     - API Key
     - API Secret
     - Access Token (optional)
   - Click "Add Store"

4. **Sync Data:**
   - Click "Sync Now" on your store card
   - Wait for the sync to complete
   - Go back to Dashboard to see your data

5. **View Insights:**
   - Navigate to Dashboard
   - Select your store from the dropdown
   - View metrics, charts, and analytics

## 🐛 Troubleshooting

### Database Connection Error

**Error:** `Can't reach database server`

**Solution:**
```bash
# Check if PostgreSQL is running
pg_isready

# Or check Docker container
docker ps

# If using Docker, restart it
docker-compose restart postgres
```

### Port Already in Use

**Error:** `Port 3000 is already in use` or `Port 3001 is already in use`

**Solution:**
- Change the port in your `.env` files
- Or stop the process using the port:
  ```bash
  # Windows
  netstat -ano | findstr :3001
  taskkill /PID <PID> /F
  ```

### Prisma Migration Errors

**Error:** `Migration failed`

**Solution:**
```bash
cd backend

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Or create a fresh migration
npx prisma migrate dev --name init
```

### Module Not Found Errors

**Error:** `Cannot find module`

**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Do this for both backend and frontend
```

### Shopify API Errors

**Error:** `Tenant not authenticated with Shopify`

**Solution:**
- Make sure you've entered the correct API credentials
- Verify your Shopify store has the app installed
- Check that API scopes are enabled:
  - `read_customers`
  - `read_orders`
  - `read_products`

## ✅ Verification Checklist

Before running, make sure:

- [ ] PostgreSQL is running
- [ ] Database exists (`xeno_db`)
- [ ] `backend/.env` file is configured
- [ ] `frontend/.env.local` file is configured
- [ ] Dependencies are installed (`npm install`)
- [ ] Migrations are run (`npx prisma migrate dev`)
- [ ] Prisma Client is generated (`npx prisma generate`)

## 🎯 Quick Commands Reference

```bash
# Install dependencies
npm run install:all

# Run migrations
cd backend && npx prisma migrate dev && npx prisma generate

# Start both servers
npm run dev

# Start backend only
cd backend && npm run dev

# Start frontend only
cd frontend && npm run dev

# View database (Prisma Studio)
cd backend && npx prisma studio
```

## 📊 Prisma Studio (Database GUI)

To view and edit your database visually:

```bash
cd backend
npx prisma studio
```

This opens a web interface at http://localhost:5555 where you can:
- View all tables
- See your data
- Edit records
- Test queries

## 🎉 You're All Set!

Once everything is running:
1. Open http://localhost:3000
2. Register/Login
3. Add your Shopify store
4. Start syncing data!

For more help, check:
- [SETUP.md](./SETUP.md) - Detailed setup guide
- [QUICK_START.md](./QUICK_START.md) - Quick reference
- [README.md](./README.md) - Project overview

