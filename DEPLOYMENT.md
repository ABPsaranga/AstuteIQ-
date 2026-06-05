# Deployment Guide

## Frontend → Hostinger
## Backend → Railway

### Prerequisites
- Hostinger account with hosting plan
- Railway account
- Domain configured in Hostinger (optional but recommended)
- **Note**: This project uses Supabase for data storage and authentication. No local database required.

### 1. Backend Deployment (Railway)

1. **Connect Repository**
   - Go to [Railway.app](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Connect your GitHub repository
   - Select the repository containing this project

2. **Configure Environment**
   - Railway will automatically detect the Python app
   - Set environment variables in Railway dashboard:
     ```
     SUPABASE_URL=https://mkkloznbfdxvqwebcpkw.supabase.co
     SUPABASE_KEY=your_supabase_service_key
     SUPABASE_JWT_SECRET=your_jwt_secret
     ALGORITHM=HS256
     ACCESS_TOKEN_EXPIRE_MINUTES=60
     OPENAI_API_KEY=your_openai_key
     FRONTEND_URL=https://your-hostinger-domain.com
     DATABASE_URL=your_postgresql_connection_string
     ```

3. **Deploy**
   - Railway will build and deploy automatically
   - Your backend will be available at `https://your-project-name.up.railway.app`

### 2. Frontend Deployment (Hostinger)

1. **Build the Frontend**
   ```bash
   cd astuteiq
   npm run build
   ```

2. **Upload to Hostinger**
   - Login to your Hostinger control panel
   - Go to File Manager or use FTP
   - Upload the entire `dist/` folder contents to your public_html directory
   - Make sure the `.htaccess` file is uploaded (it's in the `public/` folder and copied to `dist/` during build)

3. **Configure Domain (Optional)**
   - In Hostinger, point your domain to the hosting
   - Update DNS if using custom domain

4. **Update API URL**
   - In `astuteiq/.env.production`, update `VITE_API_URL` to your Railway backend URL:
     ```
     VITE_API_URL=https://vercel.com/astuteiq/astute-iq-nsjv/694qcpVVQ5Tq1oTdB9peHvAcPf2S
     ```

### 3. Update CORS (Backend)

The backend CORS has been updated to allow Hostinger domains. Make sure your Railway environment has the correct `FRONTEND_URL`:

```
FRONTEND_URL=https://your-hostinger-domain.com
```

### 4. Testing

1. **Test Backend**: Visit `https://your-project-name.up.railway.app/api/health`
2. **Test Frontend**: Visit your Hostinger domain
3. **Test Integration**: Try logging in and uploading files

### 5. Environment Variables Summary

**Backend (Railway):**
- `SUPABASE_URL`
- `SUPABASE_KEY`
- `SUPABASE_JWT_SECRET`
- `ALGORITHM=HS256`
- `ACCESS_TOKEN_EXPIRE_MINUTES=60`
- `OPENAI_API_KEY`
- `FRONTEND_URL` (your Hostinger domain)

**Note**: No `DATABASE_URL` needed - data is handled by Supabase

**Frontend (Hostinger):**
- `VITE_API_URL` (your Railway backend URL)
- `VITE_SUPABASE_URL` (already configured)

### Troubleshooting

- **CORS Issues**: Make sure `FRONTEND_URL` in Railway matches your Hostinger domain exactly
- **API Calls Failing**: Verify `VITE_API_URL` in frontend points to Railway backend
- **Build Issues**: Make sure all dependencies are installed before building
- **SPA Routing**: The `.htaccess` file handles client-side routing for React Router

### File Structure After Deployment

```
Hostinger (Frontend):
public_html/
├── index.html
├── assets/
│   ├── index-*.css
│   └── index-*.js
├── .htaccess
└── (other built files)

Railway (Backend):
/app/
├── app/
│   ├── main.py
│   └── ...
├── requirements.txt
├── railway.json
└── ...
```

### Database Architecture

This project uses **Supabase** for all data storage and authentication:
- **No local database** required
- **No SQLAlchemy/SQLite** - fully removed
- **Supabase handles**: User auth, review data, file storage
- **Railway**: Runs the FastAPI backend that connects to Supabase

### Backend Code Cleanup

The following dead/broken code has been removed:
- `app/models/review.py` - Misnamed router code (moved to proper location)
- `app/api/routes/auth.py` - Stub endpoint with no functionality
- `app/services/ai_service.py` - OpenAI code (project uses Anthropic)
- `app/services/review_engine.py` - Broken imports and unused
- `app/utils/claude_client.py` - Bugs and superseded by soa.py

**Reviews router** (`app/api/routes/reviews.py`) has been rewritten to:
- Use Supabase for persistence instead of JSON files
- Call actual SOA AI processing instead of mock data
- Wire up stats endpoint with real data
- Support proper review history and overrides