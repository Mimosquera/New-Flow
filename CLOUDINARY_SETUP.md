# Cloudinary Setup Guide for New Flow Barbershop

This guide will help you fix the post creation issue by migrating from local file storage to Cloudinary cloud storage.

## Why This Change?

Heroku uses an **ephemeral filesystem** - any files uploaded to the server are deleted when:
- The dyno restarts (at least once per day)
- The app redeploys
- The dyno sleeps

Cloudinary provides permanent, reliable cloud storage for your images and videos.

## Step 1: Create Cloudinary Account

1. Go to [https://cloudinary.com](https://cloudinary.com)
2. Click "Sign Up" and create a free account
3. Once logged in, go to your Dashboard

## Step 2: Get Your Cloudinary Credentials

On your Cloudinary Dashboard, you'll see:
- **Cloud Name**: (e.g., `dxxxxxxxx`)
- **API Key**: (e.g., `123456789012345`)
- **API Secret**: (e.g., `abcdefghijklmnopqrstuvwxyz`)

**IMPORTANT**: Keep your API Secret private!

## Step 3: Add Environment Variables to Heroku

### Option A: Using Heroku CLI

```bash
heroku config:set CLOUDINARY_CLOUD_NAME=your_cloud_name --app new-flow-barbershop-573618993028
heroku config:set CLOUDINARY_API_KEY=your_api_key --app new-flow-barbershop-573618993028
heroku config:set CLOUDINARY_API_SECRET=your_api_secret --app new-flow-barbershop-573618993028
```

### Option B: Using Heroku Dashboard

1. Go to [https://dashboard.heroku.com/apps/new-flow-barbershop-573618993028/settings](https://dashboard.heroku.com/apps/new-flow-barbershop-573618993028/settings)
2. Click "Reveal Config Vars"
3. Add these three variables:
   - Key: `CLOUDINARY_CLOUD_NAME`, Value: your cloud name
   - Key: `CLOUDINARY_API_KEY`, Value: your API key
   - Key: `CLOUDINARY_API_SECRET`, Value: your API secret

## Step 4: Add to Local .env File (for local testing)

Add these lines to `server/.env`:

```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Step 5: Commit and Push Changes

```bash
# Make sure you're in the project root directory
cd "c:\Users\micha\MiMo Projects\new_flow_0.2"

# Stage all changes
git add .

# Commit changes
git commit -m "Migrate file uploads to Cloudinary for Heroku compatibility

- Replace local filesystem storage with Cloudinary cloud storage
- Add cloudinary_id field to updates table
- Update frontend to handle both Cloudinary and legacy URLs
- Create migration for cloudinary_id column

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# Push to GitHub
git push origin master

# Push to Heroku (if you have Heroku remote configured)
git push heroku master
```

## Step 6: Run Database Migration on Heroku

After deploying, run the migration to add the `cloudinary_id` column:

```bash
heroku run npx sequelize-cli db:migrate --app new-flow-barbershop-573618993028
```

## Step 7: Test the Changes

1. Go to [https://newflowbarbershop.com](https://newflowbarbershop.com)
2. Log in to the employee dashboard
3. Try creating a new post with an image or video
4. It should now work without errors!

## Verification

To verify everything is working:

1. **Check Heroku logs**:
   ```bash
   heroku logs --tail --app new-flow-barbershop-573618993028
   ```

2. **Check Cloudinary dashboard**:
   - Go to Media Library in your Cloudinary account
   - You should see uploaded files in the `newflow-updates` folder

## Troubleshooting

### Error: "Missing required parameter - public_id"
- Make sure all three Cloudinary environment variables are set correctly

### Error: "Invalid cloud_name"
- Double-check your CLOUDINARY_CLOUD_NAME in Heroku config vars

### Old posts still have local URLs
- This is expected! Old posts will continue to use local URLs
- The frontend code handles both formats automatically
- Only new posts will use Cloudinary

### Local development not working
- Make sure you added Cloudinary variables to `server/.env`
- Restart your local server after adding env variables

## Benefits of This Change

✅ **Permanent storage** - Files never get deleted
✅ **Better performance** - Cloudinary's CDN delivers images faster
✅ **Automatic optimization** - Cloudinary optimizes images for web
✅ **Transformations** - You can resize/crop images on-the-fly in the future
✅ **Free tier** - 25GB storage, 25GB monthly bandwidth

## Free Tier Limits

Cloudinary free tier includes:
- 25GB storage
- 25GB monthly bandwidth
- 25 monthly credits
- Automatic image optimization

This should be more than enough for a barbershop's needs!

## Next Steps (Optional)

Once everything is working, you can:
1. Enable automatic image optimization in Cloudinary settings
2. Set up transformations for thumbnails (smaller file sizes)
3. Delete old files from the `server/uploads` directory (they're not used anymore)
