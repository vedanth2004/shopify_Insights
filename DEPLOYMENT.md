# Deployment Guide - Render (Full Stack Deployment)

This guide walks you through deploying ShopifyInsights using:
- **Backend**: Render (Web Service)
- **Database**: Render (Managed PostgreSQL)
- **Frontend**: Render (Static Site or Web Service)

## Prerequisites

- GitHub account with your code pushed to a repository
- Render account (free tier available)
- Vercel account (free tier available)

## Step 1: Set up Render PostgreSQL Database

1. **Create PostgreSQL Database on Render**
   - Go to https://render.com
   - Sign in with GitHub
   - Click **New +** → **PostgreSQL**
   - Configure the database:
     - **Name**: `shopify-insights-db`
     - **Database**: `shopify_insights` (or leave default)
     - **User**: `shopify_user` (or leave default)
     - **Region**: Choose closest to your users
     - **PostgreSQL Version**: 14 or higher
     - **Plan**: Free (or paid for production)
   - Click **Create Database**
   - Wait 2-3 minutes for provisioning

2. **Get Database Connection String**
   - Once created, go to your database dashboard
   - Find **Internal Database URL** (for Render services)
   - Copy the connection string
   - Format: `postgresql://[user]:[password]@[host]:[port]/[database]`
   - Save this for Step 2

3. **Note the Connection Details**
   - Render provides the connection string automatically
   - You can also see individual components (host, port, database, user, password)
   - The Internal Database URL is used for services on Render

## Step 2: Deploy Backend to Render

1. **Create Web Service**
   - Go to https://render.com
   - Sign in with GitHub
   - Click **New +** → **Web Service**
   - Connect your repository
   - Select the repository

2. **Configure Service**
   - **Name**: `shopify-insights-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npx prisma migrate deploy && npm start`
   - **Instance Type**: Free (or paid for production)

3. **Link PostgreSQL Database**
   - In the Web Service settings, scroll to **Environment**
   - Find **Add Environment Variable**
   - Click **Link Resource** next to PostgreSQL
   - Select your `shopify-insights-db` database
   - This automatically adds `DATABASE_URL` environment variable

4. **Add Other Environment Variables**
   Click "Add Environment Variable" and add:
   ```env
   JWT_SECRET=generate-a-strong-random-secret-here
   SHOPIFY_API_KEY=your-shopify-api-key
   SHOPIFY_API_SECRET=your-shopify-api-secret
   SHOPIFY_WEBHOOK_SECRET=your-webhook-secret
   SHOPIFY_HOST=your-frontend-url.vercel.app
   FRONTEND_URL=https://your-frontend-url.vercel.app
   CORS_ORIGIN=https://your-frontend-url.vercel.app
   PORT=3001
   NODE_ENV=production
   ```
   
   **Note**: 
   - `DATABASE_URL` is automatically set when you link the PostgreSQL database
   - You'll update `SHOPIFY_HOST`, `FRONTEND_URL`, and `CORS_ORIGIN` after deploying the frontend

5. **Deploy**
   - Click **Create Web Service**
   - Wait for build to complete (5-10 minutes)
   - The database migrations will run automatically on first deploy
   - Note your backend URL: `https://shopify-insights-backend.onrender.com`

## Step 3: Deploy Frontend to Vercel

1. **Import Project**
   - Go to https://vercel.com
   - Sign in with GitHub
   - Click **Add New** → **Project**
   - Import your repository

2. **Configure Project**
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)

3. **Add Environment Variables**
   ```env
   NEXT_PUBLIC_API_URL=https://shopify-insights-backend.onrender.com
   NEXTAUTH_URL=https://your-project-name.vercel.app
   NEXTAUTH_SECRET=generate-a-strong-random-secret-here
   ```
   
   **Note**: `NEXTAUTH_URL` will be your Vercel deployment URL. You can update it after first deployment.

4. **Deploy**
   - Click **Deploy**
   - Wait for build to complete (2-5 minutes)
   - Note your frontend URL: `https://your-project-name.vercel.app`

## Step 4: Update Backend with Frontend URL

1. **Get Frontend URL**
   - From Render dashboard, copy your frontend deployment URL

2. **Update Render Backend Environment Variables**
   - Go to Render dashboard
   - Select your backend service (`shopify-insights-backend`)
   - Go to **Environment** tab
   - Update:
     - `SHOPIFY_HOST`: `shopify-insights-frontend.onrender.com` (without https://)
     - `FRONTEND_URL`: `https://shopify-insights-frontend.onrender.com`
     - `CORS_ORIGIN`: `https://shopify-insights-frontend.onrender.com`
   - Click **Save Changes**
   - Service will automatically redeploy

## Step 5: Verify Both Services

1. **Test Backend**
   - Visit: `https://shopify-insights-backend.onrender.com/health`
   - Should return: `{"status":"ok","timestamp":"..."}`

2. **Test Frontend**
   - Visit your frontend URL: `https://shopify-insights-frontend.onrender.com`
   - Should see the login page
   - Try registering a new account

3. **Verify Database Connection**
   - Register a user in the frontend
   - Check Render database dashboard → Connect → View data
   - Should see the new user record in the `User` table

## Step 6: Verify Deployment

1. **Test Backend**
   - Visit: `https://your-backend-url.onrender.com/health`
   - Should return: `{"status":"ok","timestamp":"..."}`

2. **Test Frontend**
   - Visit your Vercel URL
   - Should see the login page
   - Try registering a new account

3. **Test Database Connection**
   - Register a user in the frontend
   - Check Supabase Dashboard → Table Editor → `User` table
   - Should see the new user record

## Troubleshooting

### Backend Issues

**Build Fails:**
- Check Render build logs
- Ensure `DATABASE_URL` is correct
- Verify Prisma schema is valid

**Database Connection Errors:**
- Verify Supabase connection string uses pooler mode
- Check if database is active in Supabase dashboard
- Ensure `sslmode=require` is in connection string

**CORS Errors:**
- Verify `CORS_ORIGIN` matches your Vercel URL exactly
- Check `FRONTEND_URL` is set correctly
- Ensure no trailing slashes in URLs

### Frontend Issues

**Build Fails:**
- Check Render build logs
- Ensure `NEXT_PUBLIC_API_URL` is set correctly
- Verify Node version is 18+

**API Connection Errors:**
- Verify `NEXT_PUBLIC_API_URL` points to your Render backend URL
- Check backend is running (visit `/health` endpoint)
- Check browser console for CORS errors
- Ensure backend `CORS_ORIGIN` includes your frontend URL

**Authentication Errors:**
- Verify `NEXTAUTH_URL` matches your Render frontend URL
- Ensure `NEXTAUTH_SECRET` is set
- Check backend JWT_SECRET matches

### Database Issues

**Migration Errors:**
- Check Render database logs
- Verify DATABASE_URL is correctly linked
- Ensure database is active in Render dashboard
- Try running migrations manually: `npx prisma migrate deploy`

## Environment Variables Checklist

### Render (Backend)
- [ ] `DATABASE_URL` - Automatically set when linking PostgreSQL (or Render connection string)
- [ ] `JWT_SECRET` - Strong random secret
- [ ] `SHOPIFY_API_KEY` - From Shopify Partner Dashboard
- [ ] `SHOPIFY_API_SECRET` - From Shopify Partner Dashboard
- [ ] `SHOPIFY_WEBHOOK_SECRET` - From Shopify Partner Dashboard
- [ ] `SHOPIFY_HOST` - Your Vercel frontend URL (no https://)
- [ ] `FRONTEND_URL` - Your Vercel frontend URL (with https://)
- [ ] `CORS_ORIGIN` - Your Vercel frontend URL (with https://)
- [ ] `PORT` - 3001
- [ ] `NODE_ENV` - production

### Render (Frontend)
- [ ] `NEXT_PUBLIC_API_URL` - Your Render backend URL
- [ ] `NEXTAUTH_URL` - Your Render frontend URL
- [ ] `NEXTAUTH_SECRET` - Strong random secret

## Post-Deployment

1. **Set up Custom Domains** (optional)
   - Render: Add custom domain in service settings
   - Vercel: Add custom domain in project settings
   - Update environment variables with new domains

2. **Enable Auto-Deploy**
   - Both Render and Vercel auto-deploy on git push
   - Ensure main branch is connected

3. **Set up Monitoring**
   - Render: Built-in logs and metrics
   - Vercel: Built-in analytics
   - Supabase: Built-in database monitoring

4. **Backup Strategy**
   - Supabase: Automatic daily backups (paid plans)
   - Consider setting up manual backups for free tier

## Cost Estimate

**Free Tier:**
- Render PostgreSQL: Free (90 days, then $7/month for 1GB)
- Render Backend Web Service: Free (spins down after 15 min inactivity)
- Render Frontend Static Site: Free (unlimited)

**Production (Recommended):**
- Render PostgreSQL: $7/month (1GB) or $20/month (10GB)
- Render Backend Web Service: $7/month (always-on instance)
- Render Frontend Static Site: Free (or $7/month for custom domain)

Total: ~$14-21/month for production setup (depending on database size)

