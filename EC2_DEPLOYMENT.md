# SubTrack EC2 Deployment Guide

## Quick Reference
- **Domain**: subtrack.pulseguard.in
- **Repo**: https://github.com/Hrshw/deploymenet-subtrack.git
- **Port**: 5000 (internal), 80/443 (nginx)

---

## Step 1: SSH into EC2

```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

---

## Step 2: Install Node.js 20.x (LTS)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node -v  # Should show v20.x.x
npm -v
```

---

## Step 3: Install PM2 & Git

```bash
sudo npm install -g pm2
sudo apt install git -y
```

---

## Step 4: Clone the Deployment Repo

```bash
cd /home/ubuntu
git clone https://github.com/Hrshw/deploymenet-subtrack.git subtrack
cd subtrack
```

---

## Step 5: Install Dependencies

```bash
npm install --production
```

---

## Step 6: Create Environment File

```bash
nano .env
```

Add your environment variables:

```env
PORT=5000
NODE_ENV=production

# MongoDB
MONGODB_URI=mongodb+srv://...

# Clerk
CLERK_SECRET_KEY=sk_live_...
CLERK_PUBLISHABLE_KEY=pk_live_...

# Client URL (your domain)
CLIENT_URL=https://subtrack.pulseguard.in

# Add all other required env vars...
```

Save with `Ctrl+O`, then `Enter`, then `Ctrl+X`

---

## Step 7: Test the Server

```bash
npm start
```

If it works, press `Ctrl+C` to stop.

---

## Step 8: Start with PM2

```bash
# Start the app
pm2 start dist/index.js --name subtrack

# Save the process list
pm2 save

# Set PM2 to start on boot
pm2 startup
# Run the command it outputs (copy and paste)

# Verify it's running
pm2 status
pm2 logs subtrack
```

---

## Step 9: Install & Configure Nginx

```bash
# Install Nginx
sudo apt install nginx -y

# Create site config
sudo nano /etc/nginx/sites-available/subtrack
```

Paste this configuration:

```nginx
server {
    listen 80;
    server_name subtrack.pulseguard.in;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Save and exit.

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/subtrack /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test nginx config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
sudo systemctl enable nginx
```

---

## Step 10: Add SSL with Certbot (HTTPS)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d subtrack.pulseguard.in

# Follow the prompts (enter email, agree to terms)
# Choose to redirect HTTP to HTTPS when asked
```

---

## Step 11: Update Firewall (if using UFW)

```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
sudo ufw status
```

---

## Step 12: Verify Everything Works

1. Visit: https://subtrack.pulseguard.in
2. Check API: https://subtrack.pulseguard.in/api/health
3. Check PM2: `pm2 status`
4. Check Nginx: `sudo systemctl status nginx`

---

## Future Deployments

### On your Windows machine:
```batch
.\build-for-ec2.bat
cd backend
git add .
git commit -m "Deploy: your message"
git push
```

### On EC2:
```bash
cd /home/ubuntu/subtrack
git pull
npm install --production
pm2 restart subtrack
```

---

## Useful Commands

```bash
# View logs
pm2 logs subtrack

# Monitor resources
pm2 monit

# Restart app
pm2 restart subtrack

# Stop app
pm2 stop subtrack

# View nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Restart nginx
sudo systemctl restart nginx
```

---

## Troubleshooting

### App not starting?
```bash
pm2 logs subtrack --lines 50
```

### Port 5000 in use?
```bash
sudo lsof -i :5000
```

### Nginx 502 Bad Gateway?
- Check if PM2 app is running: `pm2 status`
- Check if port matches: nginx should proxy to `localhost:5000`

### SSL certificate renewal?
Certbot auto-renews. Test with:
```bash
sudo certbot renew --dry-run
```
