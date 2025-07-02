# My Blog Platform

A simple blog platform built with Next.js, Tailwind CSS, Supabase (Auth, Database, Realtime, Storage), and ShadCN UI.

## Features

- Authentication to create/edit posts
- Public read-only view for blog posts
- Admin panel to add/edit/delete posts
- Markdown support for post content
- Image uploads using Supabase Storage
- Slug-based dynamic routes for posts
- Role-based access control (RBAC)

## Tech Stack

- Next.js 15 (with App Router)
- Tailwind CSS v4
- Supabase (Auth, Database, Realtime, Storage)
- ShadCN UI

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up your Supabase project
4. Create a `.env.local` file with your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
ADMIN_SECRET=your-admin-secret
```

5. Run the development server: `npm run dev`

## Troubleshooting Authentication Issues

If you're experiencing issues with authentication (login, logout, admin access), try these solutions:

### Use the Authentication Diagnostic Tool

Visit `/auth-diagnostic` in your browser to use a diagnostic tool that can:

- Test login functionality
- Check the current session status
- Test sign-out functionality
- Display detailed session information

This tool is helpful for debugging session persistence, user role verification, and general auth flow issues.

### Common Authentication Problems and Solutions

1. **Sessions not persisting:**

   - Make sure your browser allows cookies for your domain
   - Check that the Supabase URL and anon key are correct in `.env.local`
   - Clear browser cookies and local storage, then try logging in again

2. **Admin access not working:**

   - Verify the user has `is_admin: true` in the `profiles` table
   - Ensure the profile record was created during signup
   - Check for RLS policies that might block access to admin data

3. **Logout not working:**

   - Clear browser cookies manually
   - Use the `/auth-diagnostic` page to force sign out
   - Check the browser console for any errors during logout

4. **Test Auth Setup**

   Run the auth test script to verify Supabase connection and auth:

   ```
   npm run test:auth
   ```

- TypeScript
- React Hook Form + Zod

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- A Supabase account (free tier works fine)

### Setup

1. Clone this repository:

   ```bash
   git clone <repository-url>
   cd my-blog
   ```

2. Install dependencies:

   ```bash
   yarn install
   ```

3. Create a Supabase project:

   - Go to [supabase.com](https://supabase.com) and create a new project
   - Get your project URL and anon key from the project settings

4. Set up environment variables:

   - Add your Supabase URL and anon key to `.env.local`

   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. Set up the database schema:

   - Copy the contents of `schema.sql`
   - Go to your Supabase dashboard > SQL editor
   - Create a new query and paste the SQL
   - Run the query to set up tables and policies

6. Create a storage bucket:

   - Go to Storage in your Supabase dashboard
   - Create a new bucket called `blog-images`

7. Run the development server:

   ```bash
   yarn dev
   ```

8. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment

You can deploy this application to Vercel with a few clicks:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/my-blog)

Remember to add your Supabase URL and anon key as environment variables in your Vercel project settings.

## Project Structure

- `/app` - Next.js App Router routes
- `/components` - React components
  - `/blog` - Blog-specific components
  - `/layout` - Layout components
  - `/ui` - UI components (from ShadCN UI)
  - `/auth` - Authentication components
- `/lib` - Utility functions
- `/types` - TypeScript type definitions

## Troubleshooting Auth Issues

The application includes several tools to help debug authentication issues:

### Debug Auth Page

Visit `/debug-auth` to see detailed information about your current authentication state, including:

- Session data
- User information
- Profile details (including admin status)
- Local storage contents

This page also provides buttons to:

- Refresh the auth state
- Fix admin status
- Clear auth storage

### Fix Admin Page

Visit `/fix-admin` to manually set a user as an admin. You'll need:

1. The email address of the user
2. The admin secret (set in `.env.local` as `ADMIN_SECRET`)

### Auth Flow

1. Users sign up through `/signup`
2. The Supabase trigger automatically assigns admin status based on email
3. Users with admin status can access the `/admin` dashboard
4. If admin access isn't working, use the `/fix-admin` page to manually set admin status
