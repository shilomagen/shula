import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
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
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (
          credentials.email === 'admin@shula.com' &&
          credentials.password === 'admin'
        ) {
          return {
            id: '1',
            email: 'admin@shula.com',
          };
        }
        return null;
      },
    }),
  ],
});
