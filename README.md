# ShopifyInsights - Multi-Tenant Data Analytics Platform

A comprehensive multi-tenant Shopify Data Ingestion & Insights Service that helps enterprise retailers onboard, integrate, and analyze their customer data.

## 🚀 Features

- **Multi-tenant Architecture**: Support for multiple Shopify stores with data isolation
- **Data Ingestion**: Automated ingestion of Customers, Orders, Products from Shopify
- **Real-time Sync**: Webhook-based synchronization with Shopify stores
- **Insights Dashboard**: Beautiful UI with email authentication and comprehensive analytics
- **Scalable Backend**: RESTful API built with Express.js and PostgreSQL
- **Modern Frontend**: Next.js dashboard with interactive charts and visualizations

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Shopify Partner Account (for development store)
- Git

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js, Prisma ORM
- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js (Email)
- **Charts**: Recharts
- **Deployment**: Railway/Render/Vercel ready

## 📦 Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd shopify-insights-platform
```

2. Install dependencies:
```bash
npm run install:all
```

3. Set up environment variables:

**Backend** (`backend/.env`):
```env
# Supabase Database Connection
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?sslmode=require"
# Or use connection pooler: postgresql://postgres:[PASSWORD]@[HOST]:6543/postgres?sslmode=require

JWT_SECRET="your-secret-key"
SHOPIFY_API_KEY="your-shopify-api-key"
SHOPIFY_API_SECRET="your-shopify-api-secret"
SHOPIFY_WEBHOOK_SECRET="your-webhook-secret"
SHOPIFY_HOST="localhost:3001"
FRONTEND_URL="http://localhost:3000"
CORS_ORIGIN="http://localhost:3000"
PORT=3001
NODE_ENV=development
```

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET="your-nextauth-secret"
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com
```

4. Set up the database:

**For Local Development (PostgreSQL):**
```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

**For Supabase:**
1. Create a project at https://supabase.com
2. Go to Settings → Database
3. Copy the connection string (use "Connection pooling" for production)
4. Update `DATABASE_URL` in `backend/.env`
5. Run migrations:
```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

5. Run the development servers:
```bash
npm run dev
```

The backend will run on `http://localhost:3001` and frontend on `http://localhost:3000`.

## 🏗️ Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                        │
│  - Dashboard UI                                             │
│  - Authentication (NextAuth.js)                             │
│  - Data Visualization (Recharts)                            │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/REST API
┌──────────────────────▼──────────────────────────────────────┐
│                  Backend (Express.js)                       │
│  - REST API Endpoints                                       │
│  - Authentication Middleware                                │
│  - Multi-tenant Data Isolation                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
┌───────▼──────┐ ┌─────▼──────┐ ┌─────▼──────┐
│  PostgreSQL  │ │  Shopify   │ │  Scheduler │
│   Database   │ │    APIs    │ │   (Cron)   │
└──────────────┘ └────────────┘ └────────────┘
```

### Multi-Tenancy Strategy

- Application-level multi-tenancy using `tenantId` foreign keys
- All tenant-specific queries filter by `tenantId`
- Unique constraints on `(tenantId, shopifyId)` ensure data isolation
- Cascade deletes maintain data consistency

## 📚 API Documentation

### Authentication Endpoints

**POST** `/api/auth/register` - Register a new user
- Body: `{ email, password, name? }`
- Returns: User object and JWT token

**POST** `/api/auth/login` - Login
- Body: `{ email, password }`
- Returns: User object and JWT token

### Tenant Management

**GET** `/api/tenants` - Get all stores (requires auth)
**POST** `/api/tenants` - Add a new Shopify store
- Body: `{ storeName, storeUrl, apiKey, apiSecret, accessToken? }`
**POST** `/api/tenants/:id/sync` - Trigger manual data sync
**DELETE** `/api/tenants/:id` - Delete a store

### Insights & Analytics

**GET** `/api/insights/tenant/:tenantId/dashboard`
- Query params: `startDate?`, `endDate?` (ISO date strings)
- Returns: Metrics, top customers, top products, revenue trends

### Data Endpoints

**GET** `/api/customers/tenant/:tenantId` - Get customers
**GET** `/api/orders/tenant/:tenantId` - Get orders
**GET** `/api/products/tenant/:tenantId` - Get products

### Webhooks

**POST** `/api/webhooks/shopify` - Shopify webhook handler
**POST** `/api/webhooks/events` - Custom event handler (cart abandoned, etc.)

## 🎯 Usage

### 1. Shopify Store Setup

1. Create a Shopify Partner account at https://partners.shopify.com
2. Create a development store
3. Create a custom app in your store
4. Note down the API credentials (API Key, API Secret, Store URL)

### 2. Tenant Onboarding

1. Register/login via email on the dashboard
2. Navigate to "Add Store" section
3. Enter your Shopify store credentials:
   - Store URL (e.g., `your-store.myshopify.com`)
   - API Key
   - API Secret
4. The system will verify and sync initial data

### 3. View Insights

- Dashboard shows real-time metrics
- Filter orders by date range
- View top customers and products
- Analyze revenue trends

## 🔄 Data Synchronization

The service uses two methods for keeping data in sync:

1. **Webhooks**: Real-time updates when events occur in Shopify
2. **Scheduled Sync**: Daily sync job to catch any missed updates

## 📊 Dashboard Features

- Total customers, orders, and revenue
- Orders by date with date range filtering
- Top 5 customers by spend
- Revenue trends and growth metrics
- Product performance analytics
- Customer acquisition trends

## 🚢 Deployment

### Deployment Architecture

- **Backend**: Render (Web Service)
- **Database**: Supabase (PostgreSQL)
- **Frontend**: Vercel (Next.js)

### Step 1: Set up Supabase Database

1. Go to https://supabase.com and create a new project
2. Wait for the database to be provisioned
3. Go to **Settings → Database**
4. Copy the **Connection String** (use "Connection pooling" mode for production)
   - Format: `postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require`
5. Save this for the backend deployment

### Step 2: Deploy Backend to Render

1. Go to https://render.com and sign in
2. Click **New +** → **Web Service**
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `shopify-insights-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npx prisma migrate deploy && npm start`
5. Add Environment Variables:
   ```env
   DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require
   JWT_SECRET=your-strong-secret-key-here
   SHOPIFY_API_KEY=your-shopify-api-key
   SHOPIFY_API_SECRET=your-shopify-api-secret
   SHOPIFY_WEBHOOK_SECRET=your-webhook-secret
   SHOPIFY_HOST=your-frontend-url.vercel.app
   FRONTEND_URL=https://your-frontend-url.vercel.app
   CORS_ORIGIN=https://your-frontend-url.vercel.app
   PORT=3001
   NODE_ENV=production
   ```
6. Click **Create Web Service**
7. Note the backend URL (e.g., `https://shopify-insights-backend.onrender.com`)

### Step 3: Deploy Frontend to Vercel

1. Go to https://vercel.com and sign in
2. Click **Add New** → **Project**
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)
5. Add Environment Variables:
   ```env
   NEXT_PUBLIC_API_URL=https://shopify-insights-backend.onrender.com
   NEXTAUTH_URL=https://your-frontend-url.vercel.app
   NEXTAUTH_SECRET=your-strong-nextauth-secret-here
   ```
6. Click **Deploy**
7. Note the frontend URL (e.g., `https://shopify-insights.vercel.app`)

### Step 4: Update Backend Environment Variables

After getting your Vercel frontend URL, update the Render backend environment variables:
- `SHOPIFY_HOST`: Your Vercel frontend URL (without https://)
- `FRONTEND_URL`: Your Vercel frontend URL (with https://)
- `CORS_ORIGIN`: Your Vercel frontend URL (with https://)

Then redeploy the backend service.

### Environment Variables Summary

**Backend (Render):**
```env
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require
JWT_SECRET=your-secret-key
SHOPIFY_API_KEY=your-api-key
SHOPIFY_API_SECRET=your-api-secret
SHOPIFY_WEBHOOK_SECRET=your-webhook-secret
SHOPIFY_HOST=your-frontend-url.vercel.app
FRONTEND_URL=https://your-frontend-url.vercel.app
CORS_ORIGIN=https://your-frontend-url.vercel.app
PORT=3001
NODE_ENV=production
```

**Frontend (Vercel):**
```env
NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com
NEXTAUTH_URL=https://your-frontend-url.vercel.app
NEXTAUTH_SECRET=your-nextauth-secret
```

## 📝 Data Models

### Tenant
- `id`, `storeName`, `storeUrl`, `apiKey`, `apiSecret`, `accessToken`, `isActive`

### Customer
- `id`, `tenantId`, `shopifyId`, `email`, `firstName`, `lastName`, `phone`, `totalSpent`, `ordersCount`

### Order
- `id`, `tenantId`, `shopifyId`, `orderNumber`, `customerId`, `totalPrice`, `currency`, `orderDate`, `financialStatus`, `fulfillmentStatus`

### Product
- `id`, `tenantId`, `shopifyId`, `title`, `handle`, `vendor`, `totalInventory`, `totalSales`, `totalRevenue`

### Event (Custom Events)
- `id`, `tenantId`, `eventType`, `customerEmail`, `productId`, `orderId`, `metadata`

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 📄 License

MIT

## 👤 Author

Built for Xeno FDE Internship Assignment 2025

**Application**: ShopifyInsights - Multi-Tenant Data Analytics Platform

## 🔧 Production Considerations

- Set `NODE_ENV=production` in production
- Use strong `JWT_SECRET` and `NEXTAUTH_SECRET`
- Configure `CORS_ORIGIN` with your frontend URL
- Use Supabase connection pooler for better performance
- Set up proper database backups (Supabase Pro plan)
- Enable webhook signature verification
- Configure rate limiting
- Set up monitoring and logging
- Keep Render service always-on for production (paid plan)

## 📖 Detailed Deployment Guide

See [DEPLOYMENT.md](./DEPLOYMENT.md) for step-by-step instructions on deploying to:
- **Backend**: Render
- **Database**: Supabase  
- **Frontend**: Vercel
#   s h o p i f y _ I n s i g h t s  
 