# NextAuth.js Docker Configuration Guide

## Problem

When running a NextJS application with NextAuth.js in a Docker container, you may encounter an issue where after login, you're redirected to `0.0.0.0/dashboard` instead of your actual domain. This happens because Docker containers use `0.0.0.0` as the internal hostname, and NextAuth.js uses this for redirects.

Additionally, you may encounter image optimization issues with errors like "Unable to optimize image and unable to fallback to upstream image" when using Next.js Image component in a Docker environment.

## Solution

### 1. Environment Variables

Make sure to set the following environment variables in your production environment:

```
# Required for NextAuth.js
AUTH_SECRET=your-auth-secret-key
AUTH_TRUST_HOST=true
AUTH_REDIRECT_PROXY_URL=https://your-production-domain.com/api/auth

# Required for NextJS in Docker
HOSTNAME=0.0.0.0
PORT=3000

# Optional: Disable image optimization if needed
# NEXT_PUBLIC_DISABLE_IMAGE_OPTIMIZATION=true
```

- `AUTH_SECRET`: A secret key used to encrypt tokens
- `AUTH_TRUST_HOST`: Tells NextAuth.js to trust the host header
- `AUTH_REDIRECT_PROXY_URL`: The base URL for your auth API endpoint in production

### 2. Dockerfile Configuration

Your Dockerfile should include:

```dockerfile
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
```

### 3. NextAuth.js Configuration

The `auth.ts` file has been updated to include a `redirect` callback that ensures redirects use your production domain instead of the Docker internal hostname:

```typescript
callbacks: {
  async redirect({ url, baseUrl }) {
    // If the URL starts with the base URL, it's already an absolute URL
    if (url.startsWith(baseUrl)) return url;
    
    // If the URL is relative, prepend the base URL
    if (url.startsWith('/')) {
      // Use AUTH_REDIRECT_PROXY_URL if available, otherwise use baseUrl
      const redirectUrl = process.env.AUTH_REDIRECT_PROXY_URL || baseUrl;
      return `${redirectUrl}${url}`;
    }
    
    // Return the original URL for external URLs
    return url;
  }
}
```

### 4. Image Optimization Configuration

To fix image optimization issues in Docker, update your `next.config.ts` file:

```typescript
images: {
  domains: ['admin.moments.services', '0.0.0.0', 'localhost'],
  remotePatterns: [
    {
      protocol: 'http',
      hostname: '**',
    },
    {
      protocol: 'https',
      hostname: '**',
    },
  ],
  // Uncomment to disable image optimization in production if needed
  // unoptimized: process.env.NODE_ENV === 'production',
},
```

This configuration:
- Adds your domain to the list of allowed domains for image optimization
- Configures remote patterns to allow images from any hostname
- Provides an option to disable image optimization in production if needed

## Testing

1. Create a `.env` file based on the `.env.example` template
2. Replace the placeholder values with your actual production domain
3. Build and run your Docker container
4. Test the authentication flow to ensure redirects work correctly
5. Verify that images load properly

## Troubleshooting

If you're still experiencing issues:

1. Check that `AUTH_REDIRECT_PROXY_URL` is set correctly to your production domain
2. Ensure your Docker container can access the internet
3. Verify that your OAuth provider (if using one) has the correct callback URL configured
4. Check the NextAuth.js logs for any error messages
5. For persistent image optimization issues, try setting `unoptimized: true` in the images configuration 