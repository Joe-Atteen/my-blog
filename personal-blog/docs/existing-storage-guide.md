# Image Upload with Existing Supabase Storage

## Overview

Your blog already has a storage bucket called "blog-images" in your Supabase project. This guide explains how to use the image upload feature with your existing storage bucket.

## Using the Image Upload Feature

The image upload feature allows you to:

- Upload images when creating or editing blog posts
- Preview uploaded images
- Remove images from posts
- Set featured images that display at the top of blog posts

## Troubleshooting

If you're experiencing issues with image upload, here are steps to diagnose and fix common problems:

### 1. Check Storage Permissions

Make sure your storage bucket has the proper permissions:

1. Log into your Supabase dashboard
2. Navigate to Storage → Policies
3. Ensure the "blog-images" bucket has appropriate policies:
   - Public read access (for displaying images)
   - Authenticated write access (for uploading)

### 2. Use the Debug Tools

We've added a storage bucket tester to help diagnose issues:

1. Navigate to `/admin/debug` in your blog
2. Click on "Test Storage Bucket"
3. Check if the test succeeds or fails

### 3. Check Console Logs

If images still aren't uploading:

1. Open your browser's developer tools (F12 or right-click → Inspect)
2. Go to the Console tab
3. Attempt to upload an image
4. Look for any error messages in the console

### 4. Verify Image Paths

When using the image upload component:

1. Images are stored in the "post-images/" folder in your bucket
2. The URL is automatically set in the post's `image_url` field
3. Make sure the URLs start with your Supabase storage URL

## Technical Implementation

The image upload system consists of:

1. `ImageUpload` component in `/components/ui/image-upload.tsx`
2. Integration in the post form in `/app/admin/components/post-form.tsx`
3. Storage utility functions in `/lib/storage-utils.ts`
