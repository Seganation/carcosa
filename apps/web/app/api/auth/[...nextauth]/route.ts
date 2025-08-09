import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

const authOptions = {
  session: { strategy: "jwt" as const },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) return null;
        // Demo only: accept any non-empty credentials
        if (credentials.email && credentials.password) {
          return { id: "dev", name: "Developer", email: credentials.email } as any;
        }
        return null;
      },
    }),
  ],
} as const;

const handler = NextAuth(authOptions as any);
export { handler as GET, handler as POST };

