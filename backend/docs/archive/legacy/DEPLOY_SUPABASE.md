# Deployment Checklist: Supabase + VPS (Docker)

This guide walks you through deploying the MYFIT API using a managed Supabase PostgreSQL database and running the Node.js backend inside a Docker container on a VPS.

## 1. Prepare Supabase (Database)

1. Create a new project on [Supabase](https://supabase.com).
2. Go to **Project Settings -> Database**.
3. Copy the **Connection String** (URI format).
   - *Recommendation*: Use the **Transaction Pooler** URL (usually port 6543) if you plan to run multiple containers, or the **Direct Connection** URL if you only run a single backend instance.
4. Ensure your connection string includes `?sslmode=require` (Supabase requires TLS for external connections).

## 2. Set Up the VPS

1. SSH into your VPS.
2. Install **Docker** and **Docker Compose**.
3. Clone the MYFIT repository to your server.

## 3. Configure Environment Variables

Create a `.env` file in the project root on your VPS:

```env
# Supabase Connection String (from step 1)
# Note: The app automatically enables SSL if the host is not localhost.
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:6543/postgres?sslmode=require

# Security Secrets (Generate strong random strings)
ACCESS_TOKEN_SECRET=your_super_secret_access_token_key_here
REFRESH_TOKEN_SECRET=your_super_secret_refresh_token_key_here

# Token Lifetimes
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=30d

# Server Config
PORT=3000
HOST=0.0.0.0
```

## 4. Build and Run the App

1. Build the Docker image:
   ```bash
   docker build -t myfit-backend .
   ```

2. Run the container:
   ```bash
   docker run -d \
     --name myfit-app \
     --restart unless-stopped \
     -p 3000:3000 \
     --env-file .env \
     myfit-backend
   ```
   *Note*: The `-p 3000:3000` flag maps port 3000 of the VPS to port 3000 of the container. 

## 5. Bootstrap and Seed the Database

Since this is the first deployment, you need to create the tables in your Supabase database. You can do this directly from the backend container that has access to your `.env` variables.

1. **Bootstrap Schema**:
   ```bash
   docker exec -it myfit-app npm run db:bootstrap
   ```

2. **Seed Initial Data** (Optional, creates admin/roles/plans):
   ```bash
   # You might want to customize the seed script for production
   docker exec -it myfit-app npm run db:seed
   ```

## 6. Reverse Proxy & HTTPS (Caddy / Nginx)

Instead of exposing port 3000 directly to the internet, use a reverse proxy to handle HTTPS.

### Option A: Caddy (Recommended, Auto-HTTPS)

Create a `Caddyfile`:
```caddyfile
api.yourdomain.com {
    reverse_proxy localhost:3000
}
```
Run Caddy: `caddy start` or use the Caddy Docker image.

### Option B: Nginx

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```
*(Remember to use Certbot to get an SSL certificate for Nginx)*.

## 7. Production Best Practices

- **Health Checks**: The app should ideally have a `/healthz` endpoint for monitoring uptime.
- **Logging**: Ensure Docker logs are rotated or sent to a centralized logging service.
- **Connection Pooling**: `pg` Pool max is set to 10 by default in the app. Adjust if utilizing Supabase's Transaction Pooler heavily.
