# Deployment Guide

This guide explains how to deploy the Multi-Model Stock Valuation Tool to production.

## Deployment Options

### Option 1: Render.com (Recommended - Free Tier Available)

**Backend Deployment:**

1. **Create account** at [render.com](https://render.com)

2. **Connect GitHub repository:**
   - Dashboard → New → Web Service
   - Connect your GitHub account
   - Select `alau55/vibe_coding` repository
   - Root Directory: `multi-model-stock-valuation/backend`

3. **Configure service:**
   ```
   Name: stock-valuation-api
   Environment: Python 3
   Build Command: pip install -r requirements.txt
   Start Command: gunicorn app:app
   ```

4. **Add environment variables:**
   ```
   FLASK_ENV=production
   SECRET_KEY=<generate-random-key>
   ```

5. **Deploy:** Render will auto-deploy on push

6. **Get API URL:** `https://stock-valuation-api.onrender.com`

**Frontend Deployment:**

1. **Update API URL** in `frontend/js/app.js`:
   ```javascript
   const API_BASE_URL = 'https://stock-valuation-api.onrender.com/api';
   ```

2. **Deploy to Render Static Site:**
   - New → Static Site
   - Root Directory: `multi-model-stock-valuation/frontend`
   - Build Command: (leave empty)
   - Publish Directory: `.`

3. **Get frontend URL:** `https://stock-valuation.onrender.com`

---

### Option 2: Heroku

**Backend:**

1. **Install Heroku CLI**

2. **Create `Procfile` in backend directory:**
   ```
   web: gunicorn app:app
   ```

3. **Create `runtime.txt`:**
   ```
   python-3.11.0
   ```

4. **Deploy:**
   ```bash
   cd backend
   heroku create stock-valuation-api
   git subtree push --prefix multi-model-stock-valuation/backend heroku main
   heroku config:set FLASK_ENV=production
   ```

5. **Open:** `heroku open`

**Frontend:**
Deploy to Netlify, Vercel, or GitHub Pages (see below)

---

### Option 3: Railway.app

**Automatic Deployment:**

1. **Sign up** at [railway.app](https://railway.app)

2. **New Project → Deploy from GitHub**

3. **Select repository** and branch

4. **Railway auto-detects** Flask app

5. **Add environment variables** in dashboard

6. **Deploy** automatically on push

---

### Option 4: GitHub Pages (Frontend Only)

**Steps:**

1. **Create `gh-pages` branch:**
   ```bash
   cd multi-model-stock-valuation
   git checkout -b gh-pages
   ```

2. **Copy frontend to root:**
   ```bash
   cp -r frontend/* .
   ```

3. **Update API URL** in `js/app.js` to your deployed backend

4. **Commit and push:**
   ```bash
   git add .
   git commit -m "Deploy frontend to GitHub Pages"
   git push origin gh-pages
   ```

5. **Enable GitHub Pages:**
   - Repository Settings → Pages
   - Source: `gh-pages` branch
   - Save

6. **Access:** `https://alau55.github.io/vibe_coding/`

---

### Option 5: Vercel (Frontend)

**Quick Deploy:**

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   cd multi-model-stock-valuation/frontend
   vercel
   ```

3. **Update API URL** to production backend

4. **Production deploy:**
   ```bash
   vercel --prod
   ```

---

### Option 6: Netlify (Frontend)

**Steps:**

1. **Create `netlify.toml`:**
   ```toml
   [build]
     base = "multi-model-stock-valuation/frontend"
     publish = "."

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

2. **Deploy:**
   - Connect GitHub repo
   - Set build settings
   - Deploy

---

## Production Configuration

### Backend Requirements

Add to `requirements.txt`:
```
gunicorn==21.2.0
```

### Environment Variables

**Required:**
- `FLASK_ENV=production`
- `SECRET_KEY=<random-secret-key>`

**Optional:**
- `DATABASE_URL` (if using database)
- `CACHE_TIMEOUT=3600`
- `API_RATE_LIMIT=100`

### CORS Configuration

Update `backend/app.py` for production:
```python
CORS(app, resources={
    r"/api/*": {
        "origins": ["https://yourdomain.com", "https://alau55.github.io"]
    }
})
```

### Security Considerations

1. **Use HTTPS** for all connections
2. **Set secure SECRET_KEY**
3. **Enable rate limiting**
4. **Sanitize user inputs**
5. **Keep dependencies updated**

---

## Monitoring

### Render Logging
View logs in Render dashboard:
- Live logs
- Error tracking
- Performance metrics

### Error Tracking
Add Sentry (optional):
```bash
pip install sentry-sdk[flask]
```

```python
import sentry_sdk
from sentry_sdk.integrations.flask import FlaskIntegration

sentry_sdk.init(
    dsn="your-sentry-dsn",
    integrations=[FlaskIntegration()]
)
```

---

## Performance Optimization

### Backend

1. **Enable caching:**
   ```python
   from flask_caching import Cache
   cache = Cache(app, config={'CACHE_TYPE': 'simple'})
   ```

2. **Use CDN** for static assets

3. **Enable gzip compression:**
   ```python
   from flask_compress import Compress
   Compress(app)
   ```

### Frontend

1. **Minify JavaScript/CSS**
2. **Enable browser caching**
3. **Use CDN for Chart.js**
4. **Lazy load images**

---

## Continuous Deployment

### GitHub Actions

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Render
        run: |
          curl -X POST https://api.render.com/deploy/your-hook-url
```

---

## Troubleshooting

### Common Issues

**CORS Errors:**
- Check CORS configuration in backend
- Verify frontend URL is allowed

**API Not Responding:**
- Check backend logs
- Verify environment variables
- Check if service is running

**Slow Performance:**
- Enable caching
- Optimize API calls
- Use CDN for static files

**Data Not Loading:**
- Check Yahoo Finance API status
- Verify network connectivity
- Check rate limits

---

## Scaling

### When to Scale

- High user traffic
- Slow response times
- API rate limits hit

### Scaling Options

1. **Vertical Scaling:** Upgrade server resources
2. **Horizontal Scaling:** Add more instances
3. **Caching:** Redis/Memcached
4. **CDN:** CloudFlare, Fastly
5. **Load Balancing:** Multiple backend instances

---

## Backup and Recovery

### Data Backup
- Export user valuations regularly
- Backup environment variables
- Version control all code

### Rollback Plan
- Keep previous deployment active
- Use blue-green deployment
- Tag releases in Git

---

## Cost Estimates

### Free Tier Options

**Render.com:**
- Backend: Free (with limitations)
- Frontend: Free static hosting
- Sleeps after 15 min inactivity

**Netlify:**
- 100GB bandwidth/month free
- Unlimited sites

**Vercel:**
- 100GB bandwidth/month
- Serverless functions included

**GitHub Pages:**
- Free for public repos
- 1GB storage, 100GB bandwidth/month

### Paid Options

**Render.com:**
- Starter: $7/month (always on)
- Professional: $25/month

**Heroku:**
- Hobby: $7/month
- Professional: $25/month

---

## Health Checks

Add health check endpoint:
```python
@app.route('/health')
def health_check():
    return jsonify({'status': 'healthy'}), 200
```

Configure in deployment platform:
- Path: `/health`
- Interval: 30s
- Timeout: 5s

---

## SSL/TLS

Most platforms provide free SSL:
- Render: Automatic
- Heroku: Automatic
- Netlify: Automatic
- Vercel: Automatic

For custom domains:
- Add CNAME record
- Enable SSL in dashboard
- Force HTTPS redirect

---

*For questions, see [CONTRIBUTING.md](CONTRIBUTING.md) or open an issue.*
