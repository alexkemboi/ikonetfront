import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { loginAction, refreshAccessToken } from "@/actions/auth"
import type { JwtPayload } from "@/lib/types/auth"
import { decodeToken } from "./utils/decoder"

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

                console.log(result)

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
        async jwt({ token, user, account }) {
            if (account && user) {
                token.apiToken = user.apiToken; // Ensure you grab this from user/account
                const decoded = decodeToken(token.apiToken as string);
                token.expiresAt = (decoded?.exp as number) * 1000;
            }

            console.log(Date.now() < (token.expiresAt as number))
            // 2. Check if the backend token has expired
            if (Date.now() < (token.expiresAt as number)) {
                if (user) {
                    token.id = user.id
                    token.role = user.role
                    token.fname = user.fname
                    token.middleName = user.middleName
                    token.otherName = user.otherName
                    token.phoneNumber = user.phoneNumber
                    token.username = user.username
                    token.apiToken = user.apiToken
                }
                return token
            }

            // 3. Token expired: attempt to refresh it
            return await refreshAccessToken(token);
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
           
            if(token.error){
                session.error = token.error as "RefreshAccessTokenError" | undefined;
            }
            return session
        },
    },
})