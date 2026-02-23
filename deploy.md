# Deploying Web Kutubxona to Production

Follow these steps to deploy the application to a Linux server (Ubuntu 22.04+ recommended).

## 1. Prerequisites
- Node.js (v18+)
- PostgreSQL
- Redis
- PM2 (`npm install -g pm2`)
- Nginx

## 2. Server Setup
```bash
# Clone the repository
git clone <your-repo-url>
cd web-kutubxona

# Setup Backend
cd backend
npm install
cp .env.example .env # Update with real credentials
pm2 start ecosystem.config.cjs
pm2 save

# Setup Frontend
cd ../frontend
npm install
cp .env.example .env.production # Set VITE_API_URL to your domain
npm run build
```

## 3. Nginx Configuration
Create a config file at `/etc/nginx/sites-available/web-kutubxona`:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend Static Files
    location / {
        root /path/to/web-kutubxona/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API Proxy
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Uploads Static Files
    location /uploads {
        alias /path/to/web-kutubxona/backend/uploads;
    }
}
```

## 4. SSL (Certbot)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## 5. Monitoring
Use `pm2 monit` to see real-time logs and performance.
