# Image Troubleshooting Guide

## Common Image Issues and How to Fix Them

This guide provides solutions for common image issues in the blog platform.

### Fixed Issues

The following issues have been resolved in the latest update:

1. **Broken images on the frontend**: Images now properly load on the homepage, post listings, and single post pages.
2. **Inconsistent image path handling**: The system now properly handles various image path formats.
3. **CORS issues with Supabase Storage**: Added direct download URL support with cache busting.

### How to Fix Remaining Image Issues

If you're still experiencing issues with images:

1. **Go to the Admin Debug page**: Navigate to `/admin/debug` to access the image debugging tools.

2. **Use the Image Path Fixer**:

   - Click "Analyze Post Images" to scan your blog for image path issues
   - Use "Fix All Images" to automatically correct all detected issues
   - Or fix individual posts by clicking the "Fix Path" button next to each post

3. **Use the Image URL Fixer**:
   - If a specific image is not displaying correctly, copy its URL
   - Paste the URL in the Image URL Fixer tool
   - Click "Check Image" to see if it loads
   - If it doesn't load, click "Fix URL" to attempt a fix

### Best Practices for Images

To avoid image issues in the future:

1. **Use the correct path format**: Always upload images to the `blog/` or `post-images/` folders in your Supabase storage.

2. **Use proper image components**:

   - Always use the `<SupabaseImage>` component instead of Next.js's default `<Image>` component.
   - Example usage:
     ```jsx
     <SupabaseImage
       src={post.image_url}
       alt={post.title}
       fill={true}
       className="object-cover"
     />
     ```

3. **Store proper paths in the database**: When saving posts, ensure the `image_url` field contains a path in the format:
   - `blog/filename.jpg`
   - `post-images/filename.jpg`

### Technical Details

The image handling system now:

1. Automatically tries multiple path variations if the initial load fails
2. Adds cache busting parameters to avoid stale images
3. Falls back to direct download URLs when needed
4. Provides detailed logging in the browser console for debugging

If you encounter persistent issues, check the browser console for error messages and visit the `/admin/debug` page for diagnostic tools.
