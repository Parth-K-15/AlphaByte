# Backend Deployment Guide for Vercel

## Prerequisites
- A Vercel account (sign up at https://vercel.com)
- Vercel CLI installed (optional, but recommended)
- MongoDB Atlas database (or any cloud MongoDB instance)
- All environment variables ready

## Step 1: Install Vercel CLI (Optional but Recommended)
```bash
npm install -g vercel
```

## Step 2: Prepare Environment Variables
You'll need to set these environment variables in Vercel Dashboard:

### Required Environment Variables:
- `MONGO_URI` - Your MongoDB connection string (e.g., from MongoDB Atlas)
- `JWT_SECRET` - Secret key for JWT token generation
- `CLIENT_URL` - Your frontend URL on Vercel (e.g., https://your-app.vercel.app)
- `NODE_ENV` - Set to "production"
- `PORT` - Usually handled by Vercel automatically

### Email Service Variables (if using):
- `EMAIL_HOST` - SMTP host (e.g., smtp.gmail.com)
- `EMAIL_PORT` - SMTP port (e.g., 587)
- `EMAIL_USER` - Your email address
- `EMAIL_PASSWORD` - Your email password or app-specific password
- `EMAIL_FROM` - From email address

### Cloudinary Variables (if using for file uploads):
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

## Step 3: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Easiest)

1. Go to https://vercel.com/dashboard
2. Click "Add New Project"
3. Import your Git repository (GitHub, GitLab, or Bitbucket)
4. Select the repository containing your project
5. Configure project settings:
   - **Framework Preset**: Other
   - **Root Directory**: Server
   - **Build Command**: Leave empty (no build needed)
   - **Output Directory**: Leave empty
   - **Install Command**: npm install
6. Add all environment variables in the "Environment Variables" section
7. Click "Deploy"

### Option B: Deploy via CLI

1. Navigate to the Server directory:
```bash
cd Server
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel
```

4. Follow the prompts:
   - Set up and deploy? Yes
   - Which scope? Select your account
   - Link to existing project? No
   - What's your project's name? (Enter a name, e.g., alphabyte-backend)
   - In which directory is your code located? ./
   
5. For production deployment:
```bash
vercel --prod
```

## Step 4: Add Environment Variables via CLI (Alternative)

If using CLI, add environment variables:

```bash
vercel env add MONGO_URI
vercel env add JWT_SECRET
vercel env add CLIENT_URL
vercel env add NODE_ENV
# Add other variables as needed
```

Then select the environment (production, preview, or development).

## Step 5: Verify Deployment

1. Once deployed, Vercel will provide you with a URL (e.g., https://your-backend.vercel.app)
2. Test the health check endpoint:
```
https://your-backend.vercel.app/api/health
```

3. You should see:
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

## Step 6: Update Frontend Configuration

After backend deployment, update your frontend to use the new API URL:
- Update the API base URL in your frontend code to point to your Vercel backend URL
- Make sure to add this backend URL to CLIENT_URL environment variable

## Important Notes

### MongoDB Connection
- Make sure your MongoDB Atlas cluster allows connections from anywhere (0.0.0.0/0) or from Vercel's IP ranges
- Vercel uses serverless functions, so IP addresses may vary
- Update MongoDB Network Access settings in Atlas

### CORS Configuration
- The backend is now configured to accept requests from CLIENT_URL environment variable
- After deploying frontend, add the frontend URL to the CLIENT_URL environment variable

### Cold Starts
- Vercel serverless functions may experience cold starts (3-5 seconds delay on first request after inactivity)
- This is normal for serverless architectures

### Function Timeout
- Free tier has 10-second timeout for serverless functions
- Pro tier has 60-second timeout
- Keep this in mind for long-running operations

## Troubleshooting

### Issue: MongoDB Connection Timeout
- Check if MongoDB Atlas allows Vercel connections
- Verify MONGO_URI is correct in Vercel environment variables

### Issue: CORS Errors
- Verify CLIENT_URL is set correctly in environment variables
- Check that frontend URL is correct

### Issue: 500 Internal Server Error
- Check Vercel function logs in dashboard
- Go to your project > Deployments > Click on deployment > Functions tab

### Issue: Routes Not Working
- Verify vercel.json configuration
- Check that all route files are present

## View Logs

To view logs:
1. Go to Vercel Dashboard
2. Select your project
3. Click on "Deployments"
4. Click on a deployment
5. Click on "Functions" or "Logs" tab

Or via CLI:
```bash
vercel logs <deployment-url>
```

## Redeploy

To redeploy after making changes:

### Via Git (Automatic):
- Push changes to your Git repository
- Vercel will automatically deploy

### Via CLI:
```bash
cd Server
vercel --prod
```

## MongoDB Atlas Setup Reminder

1. Go to MongoDB Atlas (https://cloud.mongodb.com)
2. Navigate to Network Access
3. Click "Add IP Address"
4. Click "Allow Access from Anywhere" (0.0.0.0/0)
5. This is necessary for Vercel serverless functions

## Next Steps

After backend deployment is successful:
1. Note down your backend URL
2. Deploy your frontend (Client)
3. Update frontend API configuration with backend URL
4. Update backend CLIENT_URL environment variable with frontend URL
5. Test the full application

## Useful Commands

```bash
# Check deployment status
vercel ls

# View project details
vercel inspect <deployment-url>

# View logs
vercel logs <deployment-url>

# Remove deployment
vercel rm <deployment-name>

# Pull environment variables from Vercel
vercel env pull
```

## Support

For more information:
- Vercel Documentation: https://vercel.com/docs
- Vercel Node.js Documentation: https://vercel.com/docs/functions/serverless-functions/runtimes/node-js
- Vercel Environment Variables: https://vercel.com/docs/projects/environment-variables
