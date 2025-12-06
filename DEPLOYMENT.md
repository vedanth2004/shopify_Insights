# Deployment Guide - Full Stack on Render

This guide walks you through deploying ShopifyInsights entirely on Render:
- **Backend**: Render (Web Service)
- **Database**: Render (Managed PostgreSQL)
- **Frontend**: Render (Web Service)

## Prerequisites

- GitHub account with your code pushed to a repository
- Render account (free tier available)

## Quick Start: Using render.yaml (Recommended)

If you have a `render.yaml` file in your repository root, Render can automatically set up all services:

1. Go to https://render.com and sign in
2. Click **New +** → **Blueprint**
3. Connect your GitHub repository
4. Render will detect `render.yaml` and create all services automatically
5. Update environment variables as needed
6. Deploy!

## Manual Setup: Step-by-Step Guide

### Step 1: Set up Render PostgreSQL Database

1. **Create PostgreSQL Database**
   - Go to https://render.com
   - Sign in with GitHub
   - Click **New +** → **PostgreSQL**
   - Configure the database:
     - **Name**: `shopify-insights-db`
     - **Database**: `shopify_insights` (or leave default)
     - **User**: `shopify_user` (or leave default)
     - **Region**: Choose closest to your users
     - **PostgreSQL Version**: 14 or higher
     - **Plan**: Free (90 days, then $7/month) or paid for production
   - Click **Create Database**
   - Wait 2-3 minutes for provisioning

2. **Note the Connection Details**
   - Render provides the connection string automatically
   - You'll link this database to your backend service
   - The Internal Database URL is used for services on Render

### Step 2: Deploy Backend to Render

1. **Create Web Service**
   - Go to https://render.com
   - Click **New +** → **Web Service**
   - Connect your repository
   - Select the repository

2. **Configure Service**
   - **Name**: `shopify-insights-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npx prisma migrate deploy && npm start`
   - **Instance Type**: Free (spins down after 15 min) or paid (always-on)

3. **Link PostgreSQL Database**
   - In the Web Service settings, scroll to **Environment**
   - Find **Add Environment Variable**
   - Click **Link Resource** next to PostgreSQL
   - Select your `shopify-insights-db` database
   - This automatically sets `DATABASE_URL` (no need to set it manually)

4. **Add Other Environment Variables**
   Click "Add Environment Variable" and add:
   ```env
   JWT_SECRET=generate-a-strong-random-secret-here
   SHOPIFY_API_KEY=your-shopify-api-key
   SHOPIFY_API_SECRET=your-shopify-api-secret
   SHOPIFY_WEBHOOK_SECRET=your-webhook-secret
   SHOPIFY_HOST=shopify-insights-frontend.onrender.com
   FRONTEND_URL=https://shopify-insights-frontend.onrender.com
   CORS_ORIGIN=https://shopify-insights-frontend.onrender.com
   PORT=3001
   NODE_ENV=production
   ```
   
   **Note**: 
   - `DATABASE_URL` is automatically set when you link the PostgreSQL database
   - You'll update `SHOPIFY_HOST`, `FRONTEND_URL`, and `CORS_ORIGIN` after deploying the frontend

5. **Deploy**
   - Click **Create Web Service**
   - Wait for build to complete (5-10 minutes)
   - The database migrations will run automatically on first deploy via `npx prisma migrate deploy`
   - Note your backend URL: `https://shopify-insights-backend.onrender.com`

### Step 3: Deploy Frontend to Render

**Why Web Service instead of Static Site?**

This application uses **NextAuth.js** for authentication, which requires server-side API routes (`/api/auth/[...nextauth]`). Static sites on Render don't support API routes or server-side rendering, so we need a **Web Service**.

**If you want to use Static Site**, you would need to:
- Remove NextAuth.js
- Use client-side authentication only (direct API calls to backend)
- Configure Next.js for static export

**For this guide, we'll use Web Service (recommended):**

1. **Create Web Service**
   - Go to https://render.com
   - Click **New +** → **Web Service**
   - Connect your repository (same as backend)
   - Select the repository

2. **Configure Service**
   - **Name**: `shopify-insights-frontend`
   - **Root Directory**: `frontend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: Free (spins down after 15 min) or paid (always-on)

3. **Add Environment Variables**
   Click "Add Environment Variable" and add:
   ```env
   NEXT_PUBLIC_API_URL=https://shopify-insights-backend.onrender.com
   NEXTAUTH_URL=https://shopify-insights-frontend.onrender.com
   NEXTAUTH_SECRET=generate-a-strong-random-secret-here
   ```
   
   **Note**: 
   - `NEXTAUTH_URL` will be your Render frontend URL
   - Make sure `NEXT_PUBLIC_API_URL` matches your backend URL from Step 2

4. **Deploy**
   - Click **Create Web Service**
   - Wait for build to complete (3-5 minutes)
   - Note your frontend URL: `https://shopify-insights-frontend.onrender.com`

**Alternative: Static Site (Advanced - Requires Code Changes)**

If you want to use Static Site to save costs, you need to modify the code:

1. Remove NextAuth.js and API routes
2. Update `next.config.js`:
   ```js
   output: 'export'  // Enable static export
   ```
3. Use client-side only authentication (store JWT in localStorage)
4. Deploy as Static Site:
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `frontend/out`

### Step 4: Update Backend with Frontend URL

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

### Step 5: Verify Deployment

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

## Troubleshooting

### Backend Issues

**Build Fails:**
- Check Render build logs
- Ensure `DATABASE_URL` is correctly linked
- Verify Prisma schema is valid
- Check Node version compatibility

**Database Connection Errors:**
- Verify PostgreSQL database is linked correctly
- Check database is active in Render dashboard
- Ensure migrations ran successfully (check logs)

**CORS Errors:**
- Verify `CORS_ORIGIN` matches your frontend URL exactly
- Check `FRONTEND_URL` is set correctly
- Ensure no trailing slashes in URLs
- Both services must be on Render for Internal Database URL to work

### Frontend Issues

**Build Fails:**
- Check Render build logs
- Ensure `NEXT_PUBLIC_API_URL` is set correctly
- Verify Node version is 18+
- Check for TypeScript errors

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
- Check Render backend logs for migration output
- Verify DATABASE_URL is correctly linked
- Ensure database is active in Render dashboard
- Try running migrations manually in Render shell:
  ```bash
  cd backend
  npx prisma migrate deploy
  ```

**Connection Timeouts:**
- Free tier databases may have connection limits
- Consider upgrading to paid plan for production
- Check database status in Render dashboard

## Environment Variables Checklist

### Render (Backend)
- [ ] `DATABASE_URL` - Automatically set when linking PostgreSQL (or Render connection string)
- [ ] `JWT_SECRET` - Strong random secret
- [ ] `SHOPIFY_API_KEY` - From Shopify Partner Dashboard
- [ ] `SHOPIFY_API_SECRET` - From Shopify Partner Dashboard
- [ ] `SHOPIFY_WEBHOOK_SECRET` - From Shopify Partner Dashboard
- [ ] `SHOPIFY_HOST` - Your Render frontend URL (no https://)
- [ ] `FRONTEND_URL` - Your Render frontend URL (with https://)
- [ ] `CORS_ORIGIN` - Your Render frontend URL (with https://)
- [ ] `PORT` - 3001
- [ ] `NODE_ENV` - production

### Render (Frontend)
- [ ] `NEXT_PUBLIC_API_URL` - Your Render backend URL
- [ ] `NEXTAUTH_URL` - Your Render frontend URL
- [ ] `NEXTAUTH_SECRET` - Strong random secret

## Post-Deployment

1. **Set up Custom Domains** (optional)
   - Render: Add custom domain in service settings
   - Update environment variables with new domains
   - Update DNS records

2. **Enable Auto-Deploy**
   - Both services auto-deploy on git push to main branch
   - Ensure main branch is connected in Render settings

3. **Set up Monitoring**
   - Render: Built-in logs and metrics
   - Set up alerts for service downtime
   - Monitor database connections

4. **Backup Strategy**
   - Render PostgreSQL: Automatic daily backups (paid plans)
   - Consider setting up manual backups for free tier
   - Export database regularly for critical data

5. **Performance Optimization**
   - Upgrade to paid plans for always-on services
   - Use connection pooling (automatic with Render PostgreSQL)
   - Monitor and optimize database queries

## Cost Estimate

**Free Tier:**
- Render PostgreSQL: Free (90 days, then $7/month for 1GB)
- Render Backend Web Service: Free (spins down after 15 min inactivity)
- Render Frontend Web Service: Free (spins down after 15 min inactivity)

**Production (Recommended):**
- Render PostgreSQL: $7/month (1GB) or $20/month (10GB)
- Render Backend Web Service: $7/month (always-on instance)
- Render Frontend Web Service: $7/month (always-on instance)

**Total: ~$21-34/month for production setup** (depending on database size)

## Important Notes

1. **Free Tier Limitations:**
   - Services spin down after 15 minutes of inactivity
   - First request after spin-down takes longer (cold start)
   - Database free for 90 days, then requires paid plan

2. **Internal Database URL:**
   - When both backend and database are on Render, use Internal Database URL
   - This provides better performance and security
   - Automatically set when you link the database

3. **Environment Variables:**
   - Never commit `.env` files to git
   - Use Render's environment variable management
   - Keep secrets secure

4. **Database Migrations:**
   - Run automatically on deploy via `npx prisma migrate deploy`
   - Check logs to ensure migrations completed successfully
   - Can run manually in Render shell if needed

5. **CORS Configuration:**
   - Both services on Render means same origin (better security)
   - Still configure CORS_ORIGIN for external API access
   - Update if you add custom domains

## Support

- Render Documentation: https://render.com/docs
- Render Status: https://status.render.com
- Render Community: https://community.render.com
