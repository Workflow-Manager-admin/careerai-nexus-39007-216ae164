import NextAuth, { AuthOptions, SessionStrategy, User as NextAuthUser, Session } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { compare, hash } from "bcryptjs";
import { z } from "zod";
import prisma from "@/lib/prisma";
import type { JWT } from "next-auth/jwt";

/**
 * Upsert (insert/update) User and Account records robustly for ANY provider on each login.
 * Ensures User and Account are always in sync (flexible for multiple OAuth+credentials providers).
 * Merges extensible profile fields and gracefully handles provider mapping for future expansion.
 * Returns the authoritative/updated user row for JWT/session construction.
 *
 * Supports arbitrary OAuth providers, merges any incoming profile fields (name, email, avatar, bio, etc),
 * and can persist additional extensible data under 'profile' JSON.
 */
async function upsertUserAndAccount({ user, account, profile }) {
  if (!account?.provider || !account?.providerAccountId) return user;

  // Try find user by account
  let dbUser =
    (await prisma.user.findFirst({
      where: {
        accounts: {
          some: {
            provider: account.provider,
            providerAccountId: account.providerAccountId,
          },
        },
      },
      include: { accounts: true },
    })) ||
    (user.email
      ? await prisma.user.findUnique({
          where: { email: user.email },
          include: { accounts: true },
        })
      : null);

  // Enrich/normalize incoming profile info for extensibility
  const extProfile = {
    ...(typeof dbUser?.profile === "object" && dbUser?.profile ? dbUser?.profile : {}),
    ...(profile && typeof profile === "object" ? profile : {}),
  };
  // Make extensible fields explicit (handle merges/wins)
  const name =
    user?.name ??
    profile?.name ??
    profile?.displayName ??
    extProfile?.name ??
    dbUser?.name ??
    null;
  const image =
    user?.image ??
    profile?.picture ??
    profile?.image ??
    extProfile?.avatar_url ??
    extProfile?.image ??
    dbUser?.image ??
    null;
  const email =
    user?.email ??
    profile?.email ??
    dbUser?.email ??
    null;

  const avatar = image || profile?.avatar || extProfile?.avatar || dbUser?.image || null;
  const bio =
    profile?.bio ??
    extProfile?.bio ??
    undefined;

  const enrichedProfile = {
    ...extProfile,
    ...(bio ? { bio } : {}),
    ...(profile?.avatar ? { avatar: profile.avatar } : {}),
    ...(profile?.avatar_url ? { avatar: profile.avatar_url } : {}),
    ...(image ? { image } : {}),
    ...(name ? { name } : {}),
  };

  if (!dbUser) {
    // New user, create and link account
    dbUser = await prisma.user.create({
      data: {
        email: email ?? undefined,
        name,
        image,
        provider: account.provider,
        profile: Object.keys(enrichedProfile).length ? enrichedProfile : undefined,
        emailVerified:
          (account.provider === "google" && (profile?.email_verified || profile?.verified)) ?
            new Date() :
            undefined,
        lastLogin: new Date(),
        loginCount: 1,
        accounts: {
          create: {
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            type: account.type,
            access_token: account.access_token,
            refresh_token: account.refresh_token,
            expires_at: account.expires_at,
            id_token: account.id_token,
            token_type: account.token_type,
            scope: account.scope,
            session_state: account.session_state,
          },
        },
      },
    });
  } else {
    // Update minimal profile and upsert account (always on login!)
    await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        name,
        image,
        provider: account.provider ?? dbUser.provider,
        profile: Object.keys(enrichedProfile).length ? enrichedProfile : dbUser.profile,
        lastLogin: new Date(),
        loginCount: { increment: 1 },
        // always upsert provider/account
        accounts: {
          upsert: {
            where: {
              provider_providerAccountId: {
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              },
            },
            update: {
              access_token: account.access_token,
              refresh_token: account.refresh_token,
              expires_at: account.expires_at,
              id_token: account.id_token,
              token_type: account.token_type,
              scope: account.scope,
              session_state: account.session_state,
            },
            create: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              type: account.type,
              access_token: account.access_token,
              refresh_token: account.refresh_token,
              expires_at: account.expires_at,
              id_token: account.id_token,
              token_type: account.token_type,
              scope: account.scope,
              session_state: account.session_state,
            },
          },
        },
      },
    });
  }

  // Find + return latest, full user
  const result = await prisma.user.findUnique({
    where: { id: dbUser.id },
  });
  return (
    result || {
      id: user.id,
      email: user.email,
      name: name ?? user.name,
      image: image ?? user.image,
    }
  );
}

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
/*
 * PUBLIC_INTERFACE
 * Updated NextAuth configuration to ensure robust user/account upsert on login for all providers,
 * extensible for future OAuth, rich profile support, and provider mapping.
 */
export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma), // Remains for compatibility, but callback upserts override/extend
  providers: [
    // Google OAuth Provider
    GoogleProvider({
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: false,
    }),
    // Credentials Provider (email/password)
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", required: true },
        password: { label: "Password", type: "password", required: true },
        register: { label: "Register", type: "text" },
      },
      // PUBLIC_INTERFACE
      async authorize(credentials: Record<string, unknown> | undefined, req) {
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
        if (register === "true") {
          // Registration: Create user if not exists
          const existingUser = await prisma.user.findUnique({ where: { email } });
          if (existingUser) throw new Error("Email already registered.");
          const hashed = await hash(password, 10);
          const user = await prisma.user.create({
            data: {
              email,
              password: hashed,
              provider: "credentials",
              // future extensible profile fields can be set via onboarding after
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
        // Sign-in
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
  session: {
    strategy: "jwt" as SessionStrategy,
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
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
        domain: undefined,
      },
    },
  },
  secret: NEXTAUTH_SECRET,
  debug: !isProd,
  pages: {
    signIn: "/signin",
    signOut: "/signin",
    error: "/signin",
    verifyRequest: "/signin",
    newUser: "/onboarding",
  },
  callbacks: {
    // PUBLIC_INTERFACE
    async session({ session, token, user }) {
      if (token?.sub) (session.user as AppSessionUser).id = token.sub;
      if (typeof token.role === "string") {
        (session.user as AppSessionUser).role = token.role;
      }
      return session;
    },
    // PUBLIC_INTERFACE
    async jwt({ token, user, account, profile }) {
      // On OAuth login: upsert user/account and get the authoritative user record
      if (account && user && account.provider !== "credentials") {
        const upserted = await upsertUserAndAccount({ user, account, profile });
        token.id = upserted.id;
        token.email = upserted.email;
        token.role = upserted.role || "user";
      } else if (user && user.id) {
        token.id = user.id;
        token.email = user.email;
        // @ts-expect-error role might not be present on all user objects
        token.role = user.role || "user";
      }
      return token;
    },
    // PUBLIC_INTERFACE
    async signIn({ user, account, profile, email, credentials }) {
      // Hook for future custom signIn logic:
      // - Optionally restrict logins, domain allow/block, etc.
      // - All providers (OAuth/cred) now upsert user+account table on login via jwt callback above.
      return true;
    },
  },
};

// PUBLIC_INTERFACE
// NextAuth route handler for Next.js app directory (API route)
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
