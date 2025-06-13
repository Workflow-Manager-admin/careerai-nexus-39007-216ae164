import NextAuth, { AuthOptions, SessionStrategy } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { compare, hash } from "bcryptjs";
import { z } from "zod";
import prisma from "@/lib/prisma";

// -----------------------------
// ENV/Secret references
// -----------------------------
const isProd = process.env.NODE_ENV === "production";
const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  NEXTAUTH_SECRET,
  NEXTAUTH_URL,
} = process.env;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !NEXTAUTH_SECRET) {
  throw new Error(
    "Missing required environment variables (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NEXTAUTH_SECRET)"
  );
}

// -----------------------------
// Prisma singleton (handles hot reload)
// -----------------------------
/**
 * PUBLIC_INTERFACE
 * Get Prisma client instance (imported from @/lib/prisma)
 */
 
// If not already defined in lib/prisma.ts
// import { PrismaClient } from "@prisma/client";
// let prisma = globalThis.prisma || new PrismaClient();
// if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;

// -----------------------------
// Auth Options
// -----------------------------

/**
 * PUBLIC_INTERFACE
 * NextAuth.js configuration for CareerAI Nexus custom auth.
 */
export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // Google OAuth Provider
    GoogleProvider({
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: false, // Prevent account collision
    }),
    // Credentials Provider (email/password)
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", required: true },
        password: { label: "Password", type: "password", required: true },
        register: { label: "Register", type: "text" }, // Hidden param for registration
      },
      // PUBLIC_INTERFACE
      // Credentials authorization (sign-in & sign-up)
      async authorize(credentials, req) {
        // Validate schema
        const credsSchema = z.object({
          email: z.string().email(),
          password: z.string().min(6, "Password must be at least 6 characters"),
          register: z.string().optional(),
        });
        const { email, password, register } = credsSchema.parse(credentials);

        // If register === "true", handle sign-up logic
        if (register === "true") {
          // Check for existing user
          const existingUser = await prisma.user.findUnique({ where: { email } });
          if (existingUser) {
            throw new Error("Email already registered.");
          }
          // Create user (hash password)
          const hashed = await hash(password, 10);
          const user = await prisma.user.create({
            data: {
              email,
              password: hashed,
              provider: "credentials",
            },
          });
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          };
        }
        // Normal credentials sign-in
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.password || user.provider !== "credentials") {
          throw new Error("CredentialsSignin");
        }
        // Compare provided password with stored hash
        const isValid = await compare(password, user.password);
        if (!isValid) throw new Error("CredentialsSignin");

        // Optionally: update login stats
        await prisma.user.update({
          where: { id: user.id },
          data: {
            lastLogin: new Date(),
            loginCount: { increment: 1 },
          },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt" as SessionStrategy, // stateless, secure for serverless/next deployment
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 1 day
  },
  jwt: {
    secret: NEXTAUTH_SECRET,
    maxAge: 30 * 24 * 60 * 60,
  },
  cookies: {
    sessionToken: {
      name: isProd
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProd,
        domain: undefined, // Set to your production domain if required
      },
    },
  },
  secret: NEXTAUTH_SECRET,
  debug: !isProd,
  pages: {
    signIn: "/signin",
    signOut: "/signin",
    error: "/signin", // Handles sign-in error display/redirects
    verifyRequest: "/signin",
    newUser: "/onboarding", // You may want to handle onboarding
  },
  callbacks: {
    // PUBLIC_INTERFACE
    async session({ session, token, user }) {
      // Augment session with user id, role if available
      if (token?.sub) session.user.id = token.sub;
      if (token?.role) session.user.role = token.role;
      return session;
    },
    // PUBLIC_INTERFACE
    async jwt({ token, user, account, profile }) {
      // Attach user info & roles to JWT token
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.role = user.role || "user";
      }
      return token;
    },
    // PUBLIC_INTERFACE
    async signIn({ user, account, profile, email, credentials }) {
      // You can add domain allow/block logic here
      return true;
    },
  },
  adapter: PrismaAdapter(prisma),
};

/**
 * PUBLIC_INTERFACE
 * NextAuth route handler for Next.js app directory (API route)
 */
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
