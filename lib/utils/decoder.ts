// lib/jwt.ts
import { decodeJwt } from "jose";

export function decodeToken(token: string) {
    try {
        return decodeJwt(token);
    } catch (error) {
        console.error("Failed to decode token:", error);
        return null;
    }
}