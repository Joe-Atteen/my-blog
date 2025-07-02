# Image System Documentation

This document explains the image handling system in the blog project, how it works, and how to troubleshoot common issues.

## Storage Structure

Images are stored in the Supabase storage bucket named `blog-images` under two main paths:

- `blog/` - Primary location for most images
- `post-images/` - Alternative location for post-specific images

## How the Image System Works

The blog uses a custom `SupabaseImage` component that wraps Next.js's `Image` component to handle Supabase storage URLs. Here's how it works:

1. The `SupabaseImage` component takes a `src` prop which can be:

   - A simple path like `blog/image.jpg`
   - A full Supabase URL
   - Just a filename like `image.jpg` (assumed to be in `blog/`)

2. The component processes the image URL through utility functions and applies three retry strategies:

   - **Original**: Standard public URL
   - **Direct**: Direct download URL with CORS headers
   - **Unoptimized**: Bypasses Next.js image optimization

3. If all strategies fail, a fallback UI is shown with an error message.

## Troubleshooting Common Issues

### 1. Images Not Appearing

If images aren't appearing, check the following:

- **Browser Console**: Look for error messages related to image loading
- **Bucket Permissions**: Ensure the `blog-images` bucket is set to public
- **CORS Settings**: Verify CORS is configured to allow requests from your domain

Run the diagnostic script to check these settings:

```
node scripts/test-image-access.js blog/your-image-name.jpg
```

### 2. "Upstream Image Response Failed" Error

This error typically indicates:

- The image exists but there's a CORS issue
- The image optimization service can't access the file
- The file size is too large for the optimization service

Solutions:

- Try using the `unoptimized` prop on the `SupabaseImage` component
- Check CORS settings using the diagnostic script
- Update cache control settings using the `setup-storage-cache.js` script

### 3. Image Path Issues

If you're experiencing path-related issues:

- Always use consistent path structures like `blog/filename.jpg`
- When uploading new images, maintain the same folder structure
- Use the `analyzeImageUrl` utility function to debug path problems:

```javascript
import { analyzeImageUrl } from "@/lib/supabase-image-utils";

const result = analyzeImageUrl(imageUrl);
console.log(result); // Shows path recommendations
```

## Best Practices

1. **Always Use the SupabaseImage Component**:

   ```jsx
   <SupabaseImage src="blog/image.jpg" alt="Description" />
   ```

2. **Image Upload Path Consistency**:

   - Store all new images in the `blog/` folder
   - Ensure filenames are unique (UUIDs are recommended)

3. **Cache Control**:

   - Run the `setup-storage-cache.js` script to set proper caching headers
   - This improves performance and reduces load on your Supabase storage

4. **CORS Configuration**:
   - Ensure CORS is properly configured in your Supabase project settings
   - The diagnostic script can help verify and fix CORS settings

## Scripts and Utilities

The project includes several scripts to help manage and troubleshoot images:

- `scripts/test-image-access.js` - Diagnose storage access and CORS issues
- `scripts/setup-storage-cache.js` - Configure optimal cache settings
- `lib/supabase-image-utils.ts` - Utilities for working with image URLs
- `lib/storage-utils.ts` - Additional storage helpers

Run these scripts from the terminal to help diagnose and fix issues.
