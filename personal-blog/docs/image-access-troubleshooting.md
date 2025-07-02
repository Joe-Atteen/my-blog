# Troubleshooting Image Access Issues

This guide addresses the specific scenario where images exist correctly in the Supabase storage bucket but fail to display properly in the application.

## Common Symptoms

- Images show as broken in the browser
- Console errors indicating "upstream image response failed"
- Images load intermittently or only work in some environments
- Images work locally but fail in production

## Step 1: Run the Diagnostics Script

Run the diagnostics script on a specific image path that's failing:

```bash
node scripts/test-image-access.js blog/your-problematic-image-path.jpg
```

This script will help identify if:

- The image exists (which we know it does)
- The bucket permissions are correct
- CORS is properly configured

## Step 2: Check Bucket Permissions

If the images exist but aren't displaying, make sure the bucket is set to public:

1. Log in to the Supabase dashboard
2. Go to Storage > Buckets
3. Click on the "blog-images" bucket
4. Under Settings, ensure "Public bucket" is enabled
5. Save changes

## Step 3: Set Up CORS Correctly

CORS issues are a common cause of image loading failures, even when images exist:

1. Log in to the Supabase dashboard
2. Go to Storage > CORS
3. Add or verify the following configuration:

```json
[
  {
    "allowedOrigins": ["*"],
    "allowedMethods": ["GET"],
    "allowedHeaders": ["*"],
    "maxAgeSeconds": 3600,
    "exposedHeaders": ["Content-Type", "Content-Length"]
  }
]
```

For production, replace `*` with your site domain.

## Step 4: Update Bucket Cache Settings

Run our cache configuration script to improve image loading performance:

```bash
node scripts/setup-storage-cache.js
```

## Step 5: Try Different Image Loading Strategies

If images still fail to load:

1. Set `NEXT_PUBLIC_ALLOW_UNOPTIMIZED_IMAGES=true` in your `.env.local` file
2. This will bypass Next.js image optimization, which might be causing issues

## Step 6: Check Browser Network Tab

1. Open browser developer tools
2. Go to the Network tab
3. Filter by "Images"
4. Look for the failing image requests
5. Check the status codes and error messages
6. Look for CORS errors or authentication issues

## Step 7: Verify Image Paths

Make sure the image paths in the database match the actual paths in storage:

1. Images should be stored as `blog/image-name.jpg` or `post-images/image-name.jpg`
2. If paths in the database don't match, update them accordingly

## Advanced Troubleshooting

If you've tried everything above and images still fail to load:

1. **Try a direct access script**: Create a simple script that directly fetches an image with no optimization
2. **Check CDN caching**: If using a CDN, ensure it's not caching errors
3. **Examine server logs**: Look for any rate limiting or security issues
4. **Check image sizes**: Very large images might exceed optimization limits

Remember: Our diagnostics have confirmed that the images exist in the bucket, so we need to focus on access and configuration issues, not file presence.
