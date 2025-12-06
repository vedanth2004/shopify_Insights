# Deployment Guide - Render + Supabase + Vercel

This guide walks you through deploying ShopifyInsights using:
- **Backend**: Render (Web Service)
- **Database**: Supabase (PostgreSQL)
- **Frontend**: Vercel (Next.js)

## Prerequisites

- GitHub account with your code pushed to a repository
- Supabase account (free tier available)
- Render account (free tier available)
- Vercel account (free tier available)

## Step 1: Set up Supabase Database

1. **Create Supabase Project**
   - Go to https://supabase.com
   - Click "New Project"
   - Enter project name and database password (save this!)
   - Select a region close to your users
   - Click "Create new project"
   - Wait 2-3 minutes for provisioning

2. **Get Database Connection String**
   - Go to **Settings → Database**
   - Scroll to **Connection String**
   - Select **Connection Pooling** mode (recommended for production)
   - Copy the connection string
   - Format: `postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require`
   - Save this for Step 2

3. **Run Database Migrations**
   - In Supabase Dashboard, go to **SQL Editor**
   - Or use Supabase CLI (optional):
     ```bash
     npx supabase link --project-ref your-project-ref
     cd backend
     npx prisma migrate deploy
     ```

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

3. **Add Environment Variables**
   Click "Advanced" and add:
   ```env
   DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require
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
   
   **Note**: You'll update `SHOPIFY_HOST`, `FRONTEND_URL`, and `CORS_ORIGIN` after deploying the frontend.

4. **Deploy**
   - Click **Create Web Service**
   - Wait for build to complete (5-10 minutes)
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
   - From Vercel dashboard, copy your deployment URL

2. **Update Render Environment Variables**
   - Go to Render dashboard
   - Select your backend service
   - Go to **Environment** tab
   - Update:
     - `SHOPIFY_HOST`: `your-project-name.vercel.app` (without https://)
     - `FRONTEND_URL`: `https://your-project-name.vercel.app`
     - `CORS_ORIGIN`: `https://your-project-name.vercel.app`
   - Click **Save Changes**
   - Service will automatically redeploy

## Step 5: Update Frontend with Final Backend URL

1. **Get Backend URL**
   - From Render dashboard, copy your backend service URL

2. **Update Vercel Environment Variables**
   - Go to Vercel dashboard
   - Select your project
   - Go to **Settings → Environment Variables**
   - Update `NEXT_PUBLIC_API_URL` with your Render backend URL
   - Redeploy the project

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

**API Connection Errors:**
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check backend is running (visit `/health` endpoint)
- Check browser console for CORS errors

**Authentication Errors:**
- Verify `NEXTAUTH_URL` matches your Vercel URL
- Ensure `NEXTAUTH_SECRET` is set
- Check backend JWT_SECRET matches

### Database Issues

**Migration Errors:**
- Run migrations manually in Supabase SQL Editor
- Check Prisma schema is correct
- Verify connection string has correct permissions

## Environment Variables Checklist

### Render (Backend)
- [ ] `DATABASE_URL` - Supabase connection string
- [ ] `JWT_SECRET` - Strong random secret
- [ ] `SHOPIFY_API_KEY` - From Shopify Partner Dashboard
- [ ] `SHOPIFY_API_SECRET` - From Shopify Partner Dashboard
- [ ] `SHOPIFY_WEBHOOK_SECRET` - From Shopify Partner Dashboard
- [ ] `SHOPIFY_HOST` - Your Vercel frontend URL (no https://)
- [ ] `FRONTEND_URL` - Your Vercel frontend URL (with https://)
- [ ] `CORS_ORIGIN` - Your Vercel frontend URL (with https://)
- [ ] `PORT` - 3001
- [ ] `NODE_ENV` - production

### Vercel (Frontend)
- [ ] `NEXT_PUBLIC_API_URL` - Your Render backend URL
- [ ] `NEXTAUTH_URL` - Your Vercel frontend URL
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
- Supabase: Free (500MB database, 2GB bandwidth)
- Render: Free (spins down after 15 min inactivity)
- Vercel: Free (100GB bandwidth, unlimited deployments)

**Production (Recommended):**
- Supabase: $25/month (8GB database, 50GB bandwidth)
- Render: $7/month (always-on instance)
- Vercel: Free or Pro ($20/month for team features)

Total: ~$32/month for production setup

