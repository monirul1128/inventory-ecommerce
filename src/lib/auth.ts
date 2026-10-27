import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log('[Auth] Missing credentials')
            return null
          }
          
          console.log('[Auth] Looking for user:', credentials.email)
          const user = await prisma.user.findUnique({ 
            where: { email: credentials.email as string } 
          })
          
          if (!user) {
            console.log('[Auth] User not found:', credentials.email)
            return null
          }
          
          console.log('[Auth] User found, checking password')
          const isValid = await bcrypt.compare(credentials.password as string, user.password)
          
          if (!isValid) {
            console.log('[Auth] Invalid password')
            return null
          }
          
          console.log('[Auth] Login successful for:', user.email)
          return { 
            id: user.id, 
            name: user.name, 
            email: user.email, 
            role: user.role 
          }
        } catch (error) {
          console.error('[Auth] Error during authorization:', error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) { token.role = (user as any).role; token.id = user.id }
      return token
    },
    async session({ session, token }) {
      if (session.user) { (session.user as any).role = token.role; (session.user as any).id = token.id }
      return session
    },
  },
  pages: { signIn: '/admin/login' },
  session: { strategy: 'jwt' },
})
