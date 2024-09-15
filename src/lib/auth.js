import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { db } from "@/lib/db";
import { compare, hash } from "bcryptjs";
import axios from "axios";
import { env } from "./env.mjs";

export const authOptions = {
  secret: env.NEXTAUTH_SECRET,
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      id: "login",
      name: "login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const user = await db.user.findFirst({
          where: {
            email: credentials?.email,
          },
        });

        if (!credentials?.password) {
          throw new Error("Password is required");
        }

        if (!user?.password) {
          throw new Error("User doesn't have a password use another method");
        }

        const isPasswordValid = await compare(
          credentials?.password,
          user?.password
        );
        if (user && isPasswordValid) {
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            roleId: user.roleId,
            role: await db.role.findFirst({
              where: {
                id: user.roleId,
              },
            }),
          };
        }

        return null;
      },
    }),
    CredentialsProvider({
      id: "register",
      name: "register",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "john@gmail.com",
        },
        password: { label: "Password", type: "password" },
        name: {
          label: "Name",
          type: "text",
        },
      },
      async authorize(credentials) {
        try {
          const existingUser = await db.user.findFirst({
            where: {
              email: credentials?.email,
            },
          });

          if (existingUser) {
            throw new Error("User already exists");
          }

          if (!credentials?.password) {
            throw new Error("Password is required");
          }
          const userPassword = await hash(credentials?.password, 10);

          const user = await db.user.create({
            data: {
              email: credentials?.email,
              password: userPassword,
              name: credentials?.name,
              roleId: 1,
            },
          });

          try {
            const response = await axios.post(
              `${env.NEXTAUTH_URL}/api/v1/send-otp`,
              {
                email: user.email,
              }
            );

            if (response.status !== 200) {
              throw new Error("Failed to send OTP");
            }

            return {
              id: user.id,
              name: user.name,
              email: user.email,
              image: user.image,
              roleId: user.roleId,
              role: await db.role.findFirst({
                where: { id: user.roleId },
              }),
            };
          } catch (otpError) {
            await db.user.delete({ where: { id: user.id } });
            throw new Error("Failed to send OTP. Please try again.");
          }
        } catch (error) {
          throw new Error(error.message || "Registration failed");
        }
      },
    }),

    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    async session({ token, session }) {
      if (token) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.image = token.picture;
      }

      return session;
    },
    async jwt({ token, user }) {
      const dbUser = await db.user.findFirst({
        where: {
          email: token.email,
        },
      });

      if (!dbUser) {
        if (user) {
          token.id = user?.id;
          token.email = user?.email;
        }
        return token;
      }

      return {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        picture: dbUser.image,
      };
    },
  },
};
