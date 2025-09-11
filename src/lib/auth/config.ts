/**
 * NextAuth.js Configuration
 * Provides authentication configuration for the application
 */

import NextAuth from "next-auth"
import { PostgresAdapter } from "@auth/pg-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import { Pool } from "pg"
import bcrypt from "bcryptjs"
import { getConfig } from "@/lib/config/env"

// Create PostgreSQL connection pool for NextAuth
const config = getConfig()
const pool = new Pool({
  connectionString: config.DATABASE_URL,
  ssl: config.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
})

export const authConfig = {
  adapter: PostgresAdapter(pool),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { 
          label: "Email", 
          type: "email",
          placeholder: "Enter your email" 
        },
        password: { 
          label: "Password", 
          type: "password",
          placeholder: "Enter your password" 
        }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // First check the new users table
          const userResult = await pool.query(
            'SELECT id, email, name, password_hash FROM users WHERE email = $1',
            [credentials.email]
          )

          let user = userResult.rows[0]

          // If not found in users table, check legacy auth_users table
          if (!user) {
            const legacyUserResult = await pool.query(
              'SELECT id, email, password_hash FROM auth_users WHERE email = $1',
              [credentials.email]
            )
            
            const legacyUser = legacyUserResult.rows[0]
            
            if (legacyUser) {
              // Migrate user to new table
              const insertResult = await pool.query(
                `INSERT INTO users (id, email, name, password_hash, "emailVerified", created_at) 
                 VALUES ($1, $2, $3, $4, NOW(), NOW()) 
                 RETURNING id, email, name, password_hash`,
                [legacyUser.id, legacyUser.email, legacyUser.email, legacyUser.password_hash]
              )
              user = insertResult.rows[0]
            }
          }

          if (!user) {
            return null
          }

          // Verify password
          const isValidPassword = await bcrypt.compare(
            credentials.password,
            user.password_hash
          )

          if (!isValidPassword) {
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name || user.email,
            emailVerified: user.emailVerified || null,
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: "database" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async session({ session, user }) {
      if (session?.user && user) {
        session.user.id = user.id
      }
      return session
    },
    async jwt({ user, token }) {
      if (user) {
        token.uid = user.id
      }
      return token
    },
  },
  pages: {
    signIn: "/auth/signin",
    signUp: "/auth/signup",
    error: "/auth/error",
  },
  debug: config.NODE_ENV === "development",
  secret: config.NEXTAUTH_SECRET,
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)