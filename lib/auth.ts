import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { loginAction, refreshAccessToken } from "@/actions/auth"
import { jwtVerify } from "jose"
import type { JwtPayload, LoginResponse } from "@/lib/types/auth"

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
                }) as unknown as LoginResponse;

                if (!result.success || !result.data?.token) {
                    throw new Error(result.message ?? "Invalid credentials.")
                }

                const secret = process.env.AUTH_JWT_SECRET;
                if (!secret) {
                    throw new Error("AUTH_JWT_SECRET is not configured.")
                }

                let payload: JwtPayload;
                try {
                    const { payload: verified } = await jwtVerify(
                        result.data.token,
                        new TextEncoder().encode(secret),
                        { algorithms: ['HS256'] }
                    );
                    payload = verified as unknown as JwtPayload;
                } catch {
                    throw new Error("Invalid token signature.")
                }

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
                    refreshToken: result.data.refreshToken,
                    expiresAt:   payload.exp ? payload.exp * 1000 : undefined,
                    userId:      payload.userId,
                    regionId:    payload.regionId,
                    stationId:   payload.stationId,
                    locationId:  payload.locationId,
                }
            },
        }),
    ],
    secret: process.env.AUTH_SECRET,
    pages: {
        signIn: "/login",
        signOut: "/signout",
        error: "/login",
    },
    callbacks: {
        async jwt({ token, user, account }) {
            if (account && user) {
                token.apiToken = user.apiToken;
                token.refreshToken = user.refreshToken;
                token.expiresAt = user.expiresAt;
                token.regionId = user.regionId;
                token.stationId = user.stationId;
                token.locationId = user.locationId;
                token.userId = user.id;
                token.role = user.role;
                token.fname = user.fname;
                token.middleName = user.middleName;
                token.otherName = user.otherName;
                token.phoneNumber = user.phoneNumber;
                token.username = user.username;
                return token
            }

            if (token.expiresAt && Date.now() < (token.expiresAt as number)) {
                return token
            }

            if (!token.refreshToken) {
                return token;
            }

            const refreshedTokens = await refreshAccessToken(token.refreshToken as string);
                if (refreshedTokens) {
                    const secret = process.env.AUTH_JWT_SECRET;
                    if (secret) {
                        try {
                            const { payload } = await jwtVerify(
                                refreshedTokens.access_token,
                                new TextEncoder().encode(secret),
                                { algorithms: ['HS256'] }
                            );
                            return {
                                ...token,
                                apiToken: refreshedTokens.access_token,
                                expiresAt: Date.now() + (refreshedTokens.expires_in * 1000),
                                refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
                            };
                        } catch {
                            // New token failed verification
                        }
                    }
                }

            return { ...token, error: "RefreshAccessTokenError" };
        },
        session({ session, token }) {
            session.user.id          = token.id as string
            session.user.userId      = token.userId as string | undefined
            session.user.role        = token.role as string
            session.user.fname       = token.fname as string
            session.user.middleName  = token.middleName as string | undefined
            session.user.otherName   = token.otherName as string | undefined
            session.user.phoneNumber = token.phoneNumber as string | undefined
            session.user.username    = token.username as string
            session.user.apiToken    = token.apiToken as string
            session.user.expiresAt   = token.expiresAt as number | undefined
            session.user.regionId    = token.regionId as number | undefined
            session.user.stationId   = token.stationId as number | undefined
            session.user.locationId  = token.locationId as number | undefined

            if(token.error){
                session.error = token.error as string;
            }
            return session
        },
    },
})