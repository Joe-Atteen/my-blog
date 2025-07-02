/**
 * Admin Access Configuration
 *
 * This file defines which users have admin access to the application.
 * Since the Supabase database doesn't have custom roles,
 * we're using email-based authorization instead.
 */

/**
 * List of email addresses authorized to access admin areas
 */
export const authorizedAdminEmails = [
  "joeyatteen@gmail.com", // Primary admin
];

/**
 * Check if an email address has admin privileges
 * @param email The email address to check
 * @returns boolean indicating if the user has admin access
 */
export function isAuthorizedAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return authorizedAdminEmails.includes(email.toLowerCase());
}

/**
 * Check if a user object has admin privileges
 * @param user A user object with an email property
 * @returns boolean indicating if the user has admin access
 */
export function userHasAdminAccess(user: { email?: string | null }): boolean {
  return isAuthorizedAdmin(user?.email);
}
