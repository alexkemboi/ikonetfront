import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { loginAction } from "@/actions/auth"
import type { JwtPayload } from "@/lib/types/auth"

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Credentials({
            credentials: {
                username: { type: "text",     label: "Username", placeholder: "johndoe" },
                password: { type: "password", label: "Password", placeholder: "*****"   },
            },
            authorize: async (credentials) => {
                if (!credentials?.username || !credentials?.password) return null

                const result = await loginAction({
                    username: credentials.username as string,
                    password: credentials.password as string,
                })

                if (!result.success || !result.data?.token) {
                    throw new Error(result.message ?? "Invalid credentials.")
                }

                // Decode the JWT payload — no verification needed, we trust our own API
                const b64 = result.data.token
                    .split(".")[1]
                    .replace(/-/g, "+")
                    .replace(/_/g, "/")
                const payload: JwtPayload = JSON.parse(
                    Buffer.from(b64, "base64").toString("utf-8")
                )

                return {
                    id:          payload.sub ?? payload.userId ?? payload.username,
                    name:        payload.fname,
                    email:       payload.email,
                    role:        payload.role,
                    fname:       payload.fname,
                    middleName:  payload.middleName,
                    otherName:   payload.otherName,
                    phoneNumber: payload.phoneNumber,
                    username:    result.data.username ?? payload.username,
                    apiToken:    result.data.token,
                }
            },
        }),
    ],
    secret: process.env.AUTH_SECRET,
    pages: {
        signIn: "/login",
        signOut: "/signout",
        error: "/login", // Error code passed in query string as ?error=
    },
    callbacks: {
        jwt({ token, user }) {
            if (user) {
                token.id          = user.id
                token.role        = user.role
                token.fname       = user.fname
                token.middleName  = user.middleName
                token.otherName   = user.otherName
                token.phoneNumber = user.phoneNumber
                token.username    = user.username
                token.apiToken    = user.apiToken
            }
            return token
        },
        session({ session, token }) {
            session.user.id          = token.id as string
            session.user.role        = token.role        as string
            session.user.fname       = token.fname       as string
            session.user.middleName  = token.middleName  as string | undefined
            session.user.otherName   = token.otherName   as string | undefined
            session.user.phoneNumber = token.phoneNumber as string | undefined
            session.user.username    = token.username    as string
            session.user.apiToken    = token.apiToken    as string
            return session
        },
    },
})