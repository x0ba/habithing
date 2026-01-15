/**
 * Convex Auth Configuration for Clerk
 * 
 * SETUP REQUIRED:
 * 1. Go to Clerk Dashboard → JWT Templates → Create new template
 *    - Name: "convex"  
 *    - Copy the "Issuer" URL (e.g., https://your-app.clerk.accounts.dev)
 * 
 * 2. Go to Convex Dashboard → Settings → Environment Variables
 *    - Add: CLERK_JWT_ISSUER_DOMAIN = <your Clerk Issuer URL from step 1>
 * 
 * 3. Redeploy Convex: npx convex dev (or bunx convex dev)
 */
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
}
