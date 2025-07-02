# Image Upload Feature

This document explains how to use and configure the image upload functionality for blog posts.

## Overview

The image upload feature allows administrators to:

- Upload images to Supabase Storage when creating or editing blog posts
- Preview uploaded images
- Remove images from posts
- Set featured images that display at the top of blog posts

## Setup Instructions

### 1. Configure Supabase Storage

Before using the image upload feature, you need to set up the Supabase storage bucket:

```bash
# Run the setup script to create the storage bucket
yarn setup:storage
```

This script will:

- Check if the "blog-images" bucket exists
- Create it if necessary
- Configure public access for the bucket

### 2. Environment Variables

Make sure your `.env` or `.env.local` file contains the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # Only needed for the setup script
```

### 3. Access Control (Optional)

By default, the storage bucket is configured with public access for simplicity. For production use, you might want to implement more restrictive policies through the Supabase dashboard:

1. Go to Storage > Policies in your Supabase dashboard
2. Configure specific RLS (Row Level Security) policies for the "blog-images" bucket

## Using the Image Upload Component

The `ImageUpload` component is integrated in the post form and handles:

1. File selection via button
2. Drag and drop functionality
3. Uploading to Supabase
4. Progress indication
5. Preview of uploaded images
6. Error handling

### Limitations

- Maximum file size: 5MB
- Supported formats: PNG, JPG, GIF
- Images are stored in the "post-images/" folder in the Supabase bucket

## Troubleshooting

If you encounter issues with image upload:

1. Check browser console for specific error messages
2. Verify that your Supabase credentials are correct
3. Ensure the storage bucket exists and is correctly configured
4. Check that you have proper permissions in your Supabase project

### Diagnostic Commands

These commands can help diagnose and fix issues:

```bash
# Set up the storage bucket (creates it if missing)
yarn setup:storage

# Test the storage configuration
yarn test:storage
```

The `test:storage` script will validate that:

- The storage bucket exists
- You have proper permissions
- You can upload and retrieve files
- Public URLs are working correctly

## Technical Implementation

The image upload system consists of:

1. `ImageUpload` component in `/components/ui/image-upload.tsx`
2. Integration in the post form in `/app/admin/components/post-form.tsx`
3. Storage configuration script in `/scripts/create-storage-bucket.js`
