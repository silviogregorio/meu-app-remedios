import fs from 'fs';
import path from 'path';

const envPath = path.resolve('../.env');
const anonKey = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFoanl3bHNubW1rYXZndGt2cG9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MTU1NzIsImV4cCI6MjA4MDA5MTU3Mn0.jBnLg-LxGDoSTxiSvRVaSgQZDbr0h91Uxm2S7YBcMto`.replace(/\s/g, '');
const serviceKey = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFoanl3bHNubW1rYXZndGt2cG9kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUxNTU3MiwiZXhwIjoyMDgwMDkxNTcyfQ.Y0_u-A4t_kTFBwCxBFrHla_9Vum8B59_dEcwU2w03aw`.replace(/\s/g, '');

const content = `PORT=3001
FRONTEND_URL=http://localhost:3000

# Supabase Configuration
SUPABASE_URL=https://ahjywlsnmmkavgtkvpod.supabase.co
SUPABASE_SERVICE_ROLE_KEY=${serviceKey}
VITE_SUPABASE_URL=https://ahjywlsnmmkavgtkvpod.supabase.co
VITE_SUPABASE_ANON_KEY=${anonKey}

# SMTP Configuration (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=sigremedios@gmail.com
SMTP_PASS=syxw uweq vlat puya

# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyCEcfvEqplRdSnniCdq4ZfwwbXnRiexiv0
VITE_FIREBASE_AUTH_DOMAIN=sig-remedios.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=sig-remedios
VITE_FIREBASE_STORAGE_BUCKET=sig-remedios.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=723963576474
VITE_FIREBASE_APP_ID=1:723963576474:web:84d2d1098aebfe355a5f23
VITE_FIREBASE_VAPID_KEY=BL5xOWUNayV3ZDWAce-UUi-ln_-fC-dJOQt-9OCPn4AxrR31XGpg45vv4GxlACo6_vRBRT3ea8Q6dlYSe-Jn9p8

# Google Maps Platform
VITE_GOOGLE_MAPS_API_KEY=AIzaSyBplMddsBbre7pCjuMfzeGjmpsHd2IGBqk
`;

fs.writeFileSync(envPath, content, 'utf8');
console.log('✅ .env file written correctly via script');
