import "next-auth";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: string;
    apiToken?: string;
    fname: string;
    middleName?: string;
    otherName?: string;
    phoneNumber?: string;
    username: string;
    userId?: string;
    refreshToken?: string;
    expiresAt?: number;
    regionId?: number;
    stationId?: number;
    locationId?: number;
    investorScope?: string;
    companyScope?: string;
  }

  interface Session {
    error?: string;
    user: {
      role: string;
      /** Present only in server-side auth() results; never sent by the session endpoint. */
      apiToken?: string;
      fname: string;
      middleName?: string;
      otherName?: string;
      phoneNumber?: string;
      username: string;
      userId?: string;
      expiresAt?: number;
      regionId?: number;
      stationId?: number;
      locationId?: number;
      investorScope?: string;
      companyScope?: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    apiToken: string;
    fname: string;
    middleName?: string;
    otherName?: string;
    phoneNumber?: string;
    username: string;
    userId?: string;
    refreshToken?: string;
    expiresAt?: number;
    error?: string;
    regionId?: number;
    stationId?: number;
    locationId?: number;
    investorScope?: string;
    companyScope?: string;
  }
}
