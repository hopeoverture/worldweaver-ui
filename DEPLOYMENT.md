# WorldWeaver UI - Comprehensive Deployment Guide

**Project:** WorldWeaver UI - Sophisticated World-Building Application  
**Version:** 0.1.0  
**Last Updated:** September 5, 2025

This guide provides comprehensive step-by-step instructions for deploying the WorldWeaver application to various platforms, including production-ready configurations, environment setup, and best practices.

## 📋 Prerequisites

Before deploying, ensure you have:
- ✅ **Code Repository:** GitHub repository with latest code
- ✅ **Build Verification:** Application builds successfully locally
- ✅ **Dependencies:** All npm packages installed and working
- ✅ **Environment Variables:** Configuration prepared
- ✅ **Domain (Optional):** Custom domain ready for production

### Pre-Deployment Checklist
```bash
# Verify build works locally
cd "d:\World Deck\worldweaver-ui"
npm install
npm run build
npm start

# Test in production mode locally
npm run lint
npx tsc --noEmit
```

## 🚀 Deployment Option 1: Vercel (Recommended)

**Best for:** Next.js applications, automatic deployments, serverless hosting

### Step 1: Prepare Vercel Account
1. Visit [vercel.com](https://vercel.com)
2. Sign up/login with GitHub account
3. Install Vercel CLI (optional):
   ```bash
   npm i -g vercel
   ```

### Step 2: Connect GitHub Repository
1. **From Vercel Dashboard:**
   - Click **"New Project"**
   - Click **"Import Git Repository"**
   - Select your `worldweaver-ui` repository
   - Click **"Import"**

2. **Configure Project Settings:**
   - **Project Name:** `worldweaver-ui`
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `./` (default)
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `.next` (auto-detected)
   - **Install Command:** `npm install` (auto-detected)

### Step 3: Environment Variables (if needed)
1. In Vercel Dashboard → Project Settings → Environment Variables
2. Add any required variables:
   ```
   NODE_ENV=production
   NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
   ```

### Step 4: Deploy
1. Click **"Deploy"** button
2. Wait for build to complete (2-5 minutes)
3. Access your live application at the provided URL

### Step 5: Custom Domain (Optional)
1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. SSL certificate will be automatically provisioned

### Vercel CLI Deployment (Alternative)
```bash
cd "d:\World Deck\worldweaver-ui"

# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

## 🌐 Deployment Option 2: Netlify

**Best for:** Static sites, form handling, edge functions

### Step 1: Prepare Netlify Account
1. Visit [netlify.com](https://netlify.com)
2. Sign up/login with GitHub account

### Step 2: Connect Repository
1. Click **"New site from Git"**
2. Choose **"GitHub"**
3. Select `worldweaver-ui` repository
4. Configure build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `out`
   - **Production branch:** `main`

### Step 3: Configure Next.js for Static Export
Create `next.config.ts` changes for static export:
```typescript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
```

### Step 4: Add Build Script
Add to `package.json`:
```json
{
  "scripts": {
    "build:netlify": "next build && next export"
  }
}
```

### Step 5: Deploy
1. Update build command to `npm run build:netlify`
2. Click **"Deploy site"**
3. Monitor build process in deploy log

### Netlify CLI Deployment (Alternative)
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Build and deploy
npm run build:netlify
netlify deploy --prod --dir=out
```

## ☁️ Deployment Option 3: AWS Amplify

**Best for:** AWS ecosystem integration, CI/CD, scalability

### Step 1: AWS Account Setup
1. Create/login to [AWS Console](https://aws.amazon.com)
2. Navigate to AWS Amplify service
3. Click **"Host your web app"**

### Step 2: Connect Repository
1. Choose **"GitHub"** as source
2. Select `worldweaver-ui` repository
3. Choose `main` branch
4. Click **"Next"**

### Step 3: Build Settings
Amplify will auto-detect Next.js. Verify build settings:
```yaml
version: 1
applications:
  - frontend:
      phases:
        preBuild:
          commands:
            - npm ci
        build:
          commands:
            - npm run build
      artifacts:
        baseDirectory: .next
        files:
          - '**/*'
      cache:
        paths:
          - node_modules/**/*
    appRoot: /
```

### Step 4: Environment Variables
1. In build settings, add environment variables:
   ```
   NODE_ENV=production
   NEXT_PUBLIC_APP_URL=https://your-app-id.amplifyapp.com
   ```

### Step 5: Deploy
1. Click **"Save and deploy"**
2. Monitor build process (5-10 minutes)
3. Access application at provided URL

### Custom Domain on AWS Amplify
1. Go to Domain management
2. Add domain
3. Configure DNS records as instructed
4. Wait for SSL certificate provisioning

## 🐳 Deployment Option 4: Docker Containerization

**Best for:** Container orchestration, microservices, custom hosting

### Step 1: Create Dockerfile
Create `Dockerfile` in project root:
```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### Step 2: Configure Next.js for Standalone
Update `next.config.ts`:
```typescript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    outputFileTracingRoot: path.join(__dirname, '../../'),
  },
};

export default nextConfig;
```

### Step 3: Create .dockerignore
```dockerignore
Dockerfile
.dockerignore
.next
README.md
.git
.gitignore
node_modules
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.env*.local
```

### Step 4: Build and Run Docker Container
```bash
# Build Docker image
docker build -t worldweaver-ui .

# Run container locally
docker run -p 3000:3000 worldweaver-ui

# Or with environment variables
docker run -p 3000:3000 -e NODE_ENV=production worldweaver-ui
```

### Step 5: Deploy to Docker Registry
```bash
# Tag for registry
docker tag worldweaver-ui your-registry/worldweaver-ui:latest

# Push to registry
docker push your-registry/worldweaver-ui:latest
```

## 🌍 Deployment Option 5: DigitalOcean App Platform

**Best for:** Simple deployment, managed hosting, database integration

### Step 1: DigitalOcean Account
1. Create account at [digitalocean.com](https://digitalocean.com)
2. Navigate to App Platform
3. Click **"Create App"**

### Step 2: Connect Repository
1. Choose **"GitHub"** as source
2. Select `worldweaver-ui` repository
3. Choose `main` branch

### Step 3: Configure App
1. **App name:** `worldweaver-ui`
2. **Resource type:** Web Service
3. **Build command:** `npm run build`
4. **Run command:** `npm start`
5. **HTTP port:** `3000`

### Step 4: Environment Variables
Add in app settings:
```
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://worldweaver-ui-xxxxx.ondigitalocean.app
```

### Step 5: Deploy
1. Click **"Create Resources"**
2. Wait for deployment (5-10 minutes)
3. Access application at provided URL

## 🏢 Deployment Option 6: Self-Hosted VPS

**Best for:** Full control, custom configurations, cost optimization

### Step 1: Server Setup
```bash
# Connect to your VPS
ssh user@your-server-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx for reverse proxy
sudo apt install nginx -y
```

### Step 2: Deploy Application
```bash
# Clone repository
git clone https://github.com/yourusername/worldweaver-ui.git
cd worldweaver-ui

# Install dependencies
npm install

# Build application
npm run build

# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'worldweaver-ui',
    script: 'npm',
    args: 'start',
    cwd: '/path/to/worldweaver-ui',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
EOF

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Step 3: Configure Nginx
```bash
# Create Nginx configuration
sudo tee /etc/nginx/sites-available/worldweaver-ui << EOF
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/worldweaver-ui /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 4: SSL Certificate with Let's Encrypt
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Verify auto-renewal
sudo certbot renew --dry-run
```

## 🔄 Deployment Option 7: GitHub Pages (Static Export)

**Best for:** Simple static hosting, free hosting, documentation sites

### Step 1: Configure for Static Export
Update `next.config.ts`:
```typescript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  basePath: process.env.NODE_ENV === 'production' ? '/worldweaver-ui' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/worldweaver-ui/' : '',
};

export default nextConfig;
```

### Step 2: Create GitHub Actions Workflow
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          NODE_ENV: production

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v2
        with:
          path: ./out

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v2
```

### Step 3: Enable GitHub Pages
1. Go to repository Settings → Pages
2. Choose **"GitHub Actions"** as source
3. Push changes to trigger deployment

## 🛠️ Post-Deployment Configuration

### Performance Optimization
1. **Enable Gzip Compression:**
   ```nginx
   gzip on;
   gzip_vary on;
   gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
   ```

2. **Configure Caching Headers:**
   ```nginx
   location /_next/static/ {
       expires 1y;
       add_header Cache-Control "public, immutable";
   }
   ```

### Monitoring Setup
1. **Add Error Tracking (Sentry):**
   ```bash
   npm install @sentry/nextjs
   ```

2. **Analytics Integration:**
   ```typescript
   // Add to _app.tsx
   import { Analytics } from '@vercel/analytics/react';
   
   export default function App({ Component, pageProps }) {
     return (
       <>
         <Component {...pageProps} />
         <Analytics />
       </>
     );
   }
   ```

### Security Headers
Add to `next.config.ts`:
```typescript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};
```

## 🔧 Environment Variables Reference

### Production Environment Variables
```bash
# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Database (if needed)
DATABASE_URL=your-database-connection-string

# Authentication (if implemented)
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://your-domain.com

# Analytics
NEXT_PUBLIC_GA_ID=your-google-analytics-id

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

## 📊 Deployment Comparison

| Platform | Complexity | Cost | Performance | Scalability | Custom Domain |
|----------|------------|------|-------------|-------------|---------------|
| Vercel | ⭐ Easy | Free/Paid | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ |
| Netlify | ⭐ Easy | Free/Paid | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ |
| AWS Amplify | ⭐⭐ Medium | Paid | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ |
| Docker | ⭐⭐⭐ Hard | Variable | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ |
| DigitalOcean | ⭐⭐ Medium | Paid | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ |
| Self-Hosted | ⭐⭐⭐⭐ Expert | Variable | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ |
| GitHub Pages | ⭐⭐ Medium | Free | ⭐⭐⭐ | ⭐⭐ | ✅ |

## 🆘 Troubleshooting Common Deployment Issues

### Build Failures
```bash
# Check Node.js version compatibility
node --version
npm --version

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for TypeScript errors
npx tsc --noEmit
```

### Memory Issues During Build
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

### Static File Issues
```typescript
// Use proper asset paths
const imageSrc = process.env.NODE_ENV === 'production' 
  ? '/worldweaver-ui/image.png' 
  : '/image.png';
```

### API Route Issues (if using)
```typescript
// Ensure API routes work in deployment
export default function handler(req, res) {
  res.status(200).json({ message: 'API working' });
}
```

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] Code committed and pushed to GitHub
- [ ] Build passes locally (`npm run build`)
- [ ] TypeScript checks pass (`npx tsc --noEmit`)
- [ ] Linting passes (`npm run lint`)
- [ ] Environment variables configured
- [ ] Domain/hosting account ready

### Post-Deployment
- [ ] Application loads correctly
- [ ] All pages render properly
- [ ] Interactive features work
- [ ] Mobile responsiveness verified
- [ ] Performance tested (PageSpeed, Lighthouse)
- [ ] SSL certificate active
- [ ] Custom domain configured (if applicable)
- [ ] Analytics/monitoring enabled
- [ ] Error tracking configured

## 📞 Support Resources

- **Vercel Documentation:** [vercel.com/docs](https://vercel.com/docs)
- **Netlify Documentation:** [docs.netlify.com](https://docs.netlify.com)
- **AWS Amplify:** [docs.aws.amazon.com/amplify](https://docs.aws.amazon.com/amplify)
- **Next.js Deployment:** [nextjs.org/docs/deployment](https://nextjs.org/docs/deployment)
- **Docker Documentation:** [docs.docker.com](https://docs.docker.com)

---

**Recommendation:** For WorldWeaver UI, **Vercel** is the recommended deployment platform due to its seamless Next.js integration, automatic deployments, and excellent performance optimization.

Happy deploying! 🚀
