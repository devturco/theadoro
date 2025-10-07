# THEADORO Gift Marketplace - Deployment Guide

## 🚀 Production Deployment

This guide covers deploying the THEADORO Gift Marketplace to production using Vercel.

### Prerequisites

- Node.js 18+ installed
- Git repository with your code
- Vercel account (free tier available)
- Supabase project configured

### Project Overview

- **Framework**: React 18 + TypeScript + Vite
- **Backend**: Supabase (Authentication, Database, Storage)
- **Styling**: Tailwind CSS + shadcn/ui
- **Deployment**: Vercel (recommended)

## 📋 Pre-Deployment Checklist

### 1. Environment Variables

Ensure your environment variables are properly configured:

```bash
# Required Environment Variables
VITE_SUPABASE_URL=https://xdedlwozqqyhjovdobym.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
VITE_SUPABASE_PROJECT_ID=xdedlwozqqyhjovdobym
```

### 2. Build Test

Test your production build locally:

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Preview production build
npm run preview
```

The build should complete without errors and the preview should work at `http://localhost:4173/`

## 🌐 Vercel Deployment

### Method 1: Vercel CLI (Recommended)

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel --prod
   ```

### Method 2: GitHub Integration

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Configure environment variables
   - Deploy

### Method 3: Vercel Dashboard

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import from Git repository
4. Configure build settings (auto-detected from `vercel.json`)
5. Add environment variables
6. Deploy

## ⚙️ Environment Variables Setup in Vercel

In your Vercel project dashboard, add these environment variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `VITE_SUPABASE_URL` | `https://xdedlwozqqyhjovdobym.supabase.co` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `your_anon_key` | Supabase anonymous key |
| `VITE_SUPABASE_PROJECT_ID` | `xdedlwozqqyhjovdobym` | Supabase project ID |

## 🔧 Configuration Files

### vercel.json
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

## 🗄️ Database Setup

### Supabase Configuration

1. **Database Tables**: Ensure all tables are created via migrations
2. **Row Level Security (RLS)**: Verify RLS policies are in place
3. **Authentication**: Configure auth providers if needed
4. **Storage**: Set up storage buckets for file uploads

### Run Migrations

```bash
# If using Supabase CLI
supabase db push

# Or apply migrations manually in Supabase dashboard
```

## 🔐 Security Considerations

### Environment Variables
- ✅ Use `VITE_` prefix for client-side variables
- ✅ Never commit `.env` files to version control
- ✅ Use Vercel's environment variable management
- ❌ Don't expose sensitive keys in client code

### Supabase Security
- ✅ Enable Row Level Security (RLS)
- ✅ Configure proper authentication policies
- ✅ Use service role key only on server-side
- ✅ Validate user permissions in database policies

## 📊 Performance Optimization

### Build Optimization
- **Code Splitting**: Implemented via React.lazy()
- **Asset Optimization**: Images optimized and cached
- **Bundle Analysis**: Use `npm run build` to check bundle size

### Recommendations
- Consider implementing dynamic imports for large components
- Optimize images (WebP format recommended)
- Enable Vercel Analytics for performance monitoring

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**:
   ```bash
   # Clear cache and reinstall
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

2. **Environment Variable Issues**:
   - Ensure all `VITE_` prefixed variables are set
   - Check Vercel dashboard environment variables
   - Redeploy after adding new variables

3. **Routing Issues**:
   - Verify `vercel.json` rewrites configuration
   - Check React Router setup

4. **Supabase Connection Issues**:
   - Verify Supabase URL and keys
   - Check network connectivity
   - Validate RLS policies

### Debug Commands

```bash
# Check build output
npm run build

# Test production build locally
npm run preview

# Check environment variables
echo $VITE_SUPABASE_URL
```

## 📈 Post-Deployment

### Verification Steps

1. **Functionality Test**:
   - [ ] User registration/login works
   - [ ] Product browsing functions
   - [ ] Admin dashboard accessible
   - [ ] File uploads working
   - [ ] Database operations successful

2. **Performance Check**:
   - [ ] Page load times < 3 seconds
   - [ ] Images load properly
   - [ ] Mobile responsiveness
   - [ ] SEO meta tags present

3. **Security Validation**:
   - [ ] HTTPS enabled
   - [ ] Authentication working
   - [ ] Role-based access control
   - [ ] Data validation active

### Monitoring

- **Vercel Analytics**: Monitor performance and usage
- **Supabase Dashboard**: Monitor database performance
- **Error Tracking**: Consider integrating Sentry for error monitoring

## 🔄 Continuous Deployment

### Automatic Deployments

Vercel automatically deploys when you push to your main branch:

```bash
git add .
git commit -m "Update feature"
git push origin main
# Vercel automatically deploys
```

### Preview Deployments

Every pull request gets a preview deployment:
- Create feature branch
- Push changes
- Open pull request
- Get preview URL for testing

## 📞 Support

### Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Vite Documentation](https://vitejs.dev/guide/)
- [React Router Documentation](https://reactrouter.com/)

### Project Structure
```
theadoro-gift/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/         # Route components
│   ├── hooks/         # Custom React hooks
│   ├── services/      # API services
│   ├── types/         # TypeScript types
│   └── schemas/       # Zod validation schemas
├── public/            # Static assets
├── supabase/          # Database migrations
└── dist/              # Production build output
```

---

**🎉 Congratulations!** Your THEADORO Gift Marketplace is now ready for production deployment!