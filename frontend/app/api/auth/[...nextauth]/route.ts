import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import axios from 'axios'

// Note: For production, you should use Email provider instead
// This is a simplified version for the assignment

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const response = await axios.post(`${API_URL}/api/auth/login`, {
            email: credentials.email,
            password: credentials.password,
          })

          if (response.data.success && response.data.data.user) {
            return {
              id: response.data.data.user.id,
              email: response.data.data.user.email,
              name: response.data.data.user.name,
              token: response.data.data.token,
            }
          }
        } catch (error) {
          console.error('Auth error:', error)
        }

        return null
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = (user as any).token
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string
        ;(session as any).accessToken = token.accessToken
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

