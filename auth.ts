import NextAuth, { Session, User as NextAuthUser } from "next-auth";
import bcrypt from "bcryptjs";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import type { JWT } from "next-auth/jwt";
import { User } from "./models/user.model";
import { connectToDatabase } from "./database/db";

declare module "next-auth" {
  interface User {
    // This extends NextAuthUser
    id: string;
    name?: string | null;
    email: string | null;
    role?: string | null; // Added role
  }

  interface Session {
    // This extends NextAuthSession
    user: User; // Ensure user is of our extended User type
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    name?: string | null;
    email: string | null;
    role?: string | null; // Added role
  }
}

//Dont dare change anything in this file the format should be like this, else nextauth will throw error
export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
    maxAge: 10 * 24 * 60 * 60,
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or passsword");
        }

        try {
          await connectToDatabase();
          const user = await User.findOne({ email: credentials.email });
          console.log("user: ", user);

          if (!user) {
            throw new Error("No user found with this email");
          }

          // Check if user is registered with Google
          if (user.provider === "google") {
            throw new Error(
              "This email is registered with Google. Please use Google Sign In.",
            );
          }

          const isValid = await bcrypt.compare(
            credentials.password.toString(),
            user.password,
          );

          if (!isValid) {
            return null;
          }

          //returned value/object is passed as user object to jwt callback
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error) {
          console.error("Auth error: ", (error as Error).message);
          return null;
        }
      },
    }),
  ],

  pages: {
    signIn: "/sign-in",
    error: "/sign-in", // Redirect to sign-in page on error
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          await connectToDatabase();
          const existingUser = await User.findOne({ email: user.email });

          if (existingUser) {
            // Check if user is registered with credentials
            if (existingUser.provider === "credentials") {
              // Return false to block sign-in
              console.log(
                "Blocking Google sign-in for credentials user:",
                user.email,
              );
              return "/sign-in?error=OAuthAccountNotLinked";
            }

            // If user has a manual providerId (created by admin), update it with real Google ID
            if (
              existingUser.provider === "google" &&
              existingUser.providerId?.startsWith("manual_")
            ) {
              existingUser.providerId = account.providerAccountId;
              await existingUser.save();
            }

            // User exists with Google, allow sign in
            return true;
          }

          // Create new user with Google provider
          const newUser = await User.create({
            name: user.name || user.email?.split("@")[0] || "user",
            email: user.email,
            provider: "google",
            providerId: account.providerAccountId,
            role: "student",
          });

          // Update user.id to the newly created user's ID
          user.id = newUser._id.toString();

          return true;
        } catch (error) {
          console.error("Google sign in error:", error);
          // Return false to prevent sign-in
          return false;
        }
      }

      return true; // Allow credentials sign in
    },
    async jwt({
      token,
      user,
      account,
    }: {
      token: JWT;
      user?: NextAuthUser;
      account?: any;
    }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.role = user.role;
      }

      // For Google sign in, fetch user data from database
      if (account?.provider === "google" && user?.email) {
        await connectToDatabase();
        const dbUser = await User.findOne({ email: user.email });
        if (dbUser) {
          token.id = dbUser._id.toString();
          token.name = dbUser.name;
          token.email = dbUser.email;
          token.role = dbUser.role;
        }
      }

      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.role = token.role as string;
      }

      return session;
    },
  },
  secret: process.env.AUTH_SECRET!,
});
