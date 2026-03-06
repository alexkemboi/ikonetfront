import "next-auth";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: string;
    apiToken: string;
    fname: string;
    middleName?: string;
    otherName?: string;
    phoneNumber?: string;
    username: string;
  }

  interface Session {
    user: {
      role: string;
      /** Bearer token for downstream API calls */
      apiToken: string;
      fname: string;
      middleName?: string;
      otherName?: string;
      phoneNumber?: string;
      username: string;
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
  }
}
