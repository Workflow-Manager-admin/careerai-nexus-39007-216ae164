import NextAuth, { AuthOptions, SessionStrategy, User as NextAuthUser, Session } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { compare, hash } from "bcryptjs";
import { z } from "zod";
import prisma from "@/lib/prisma";
import type { JWT } from "next-auth/jwt";

// ------------------------------------------------
// ENV/Secret references (for secure, production setup)
// ------------------------------------------------
const isProd = process.env.NODE_ENV === "production";
const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  NEXTAUTH_SECRET,
  NEXTAUTH_URL, // referenced in some NextAuth flows (email verification/redirect), not currently used, but available
} = process.env;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !NEXTAUTH_SECRET) {
  throw new Error(
    "Missing required environment variables (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NEXTAUTH_SECRET)"
  );
}

// ------------------------------------------------
// Types for callback augmentation
// ------------------------------------------------
type AppUser = {
  id: string;
  email: string | null;
  name?: string | null;
  image?: string | null;
  role?: string | null;
};

type AppSessionUser = Session["user"] & { id: string; role?: string | null };

// ------------------------------------------------
// NextAuth.js configuration for CareerAI Nexus custom auth
// ------------------------------------------------

// PUBLIC_INTERFACE
export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // Google OAuth Provider
    GoogleProvider({
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: false, // Prevent account collision via email
    }),
    // Credentials Provider (email/password, robust register+login)
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", required: true },
        password: { label: "Password", type: "password", required: true },
        register: { label: "Register", type: "text" }, // Hidden param for registration
      },
      // PUBLIC_INTERFACE
      async authorize(credentials: Record<string, unknown> | undefined, req) {
        // Validate & parse credentials
        const credsSchema = z.object({
          email: z.string().email(),
          password: z.string().min(6, "Password must be at least 6 characters"),
          register: z.string().optional(),
        });
        let parsed;
        try {
          parsed = credsSchema.parse(credentials);
        } catch (err: any) {
          throw new Error("Invalid credentials format");
        }
        const { email, password, register } = parsed;

        // Handle Sign-up
        if (register === "true") {
          const existingUser = await prisma.user.findUnique({ where: { email } });
          if (existingUser) throw new Error("Email already registered.");
          // Hash password securely
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
            role: user.role,
          } as AppUser;
        }
        // Handle Sign-in
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.password || user.provider !== "credentials") {
          throw new Error("CredentialsSignin");
        }
        const isValid = await compare(password, user.password);
        if (!isValid) throw new Error("CredentialsSignin");

        // Optionally update login stats
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
          role: user.role,
        } as AppUser;
      },
    }),
  ],
  // Production-ready, stateless JWT sessions
  session: {
    strategy: "jwt" as SessionStrategy,
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 1 day, token will be refreshed after this period
  },
  // JWT configuration: strongest secret and rotation control
  jwt: {
    secret: NEXTAUTH_SECRET,
    maxAge: 30 * 24 * 60 * 60,
  },
  // Secure, production-grade cookie config
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
        // For secure deployment, set "domain" to your real domain (e.g. "yourapp.com") if running behind a custom domain
        // domain: isProd ? "your-domain.com" : undefined,
        domain: undefined,
      },
    },
  },
  secret: NEXTAUTH_SECRET,
  debug: !isProd,
  pages: {
    signIn: "/signin",
    signOut: "/signin",
    error: "/signin", // Auth errors shown on signin page
    verifyRequest: "/signin",
    newUser: "/onboarding", // Potential onboarding target page
  },
  // CALLBACKS for custom session and JWT shaping & integration with Prisma user/account
  callbacks: {
    // PUBLIC_INTERFACE
    async session({ session, token, user }) {
      // Attach user id and role from JWT to the session object for frontend use
      // Type assertion because NextAuth session.user often incomplete by default
      if (token?.sub) (session.user as AppSessionUser).id = token.sub;
      if (typeof token.role === "string") {
        (session.user as AppSessionUser).role = token.role;
      }
      return session;
    },
    // PUBLIC_INTERFACE
    async jwt({ token, user, account, profile }) {
      // On login, attach extra user info/role to token (for role-based access)
      // User available during login, not on subsequent calls
      if (user && user.id) {
        token.id = user.id;
        token.email = user.email;
        // @ts-expect-error (role might not be present on all user objects)
        token.role = user.role || "user";
      }
      return token;
    },
    // PUBLIC_INTERFACE
    async signIn({ user, account, profile, email, credentials }) {
      // Allow all sign-ins; add additional logic (domain allow, etc) here if needed.
      return true;
    },
  },
};

// PUBLIC_INTERFACE
// NextAuth route handler for Next.js app directory (API route)
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
