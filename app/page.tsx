import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
 let shouldOpenDashboard = false;
 try {
 const session = await auth();
 shouldOpenDashboard = !!session?.user && session.error !== "RefreshAccessTokenError";
 } catch {
 // Auth evaluation failed — proceed to /login
 }
 redirect(shouldOpenDashboard ? "/dashboard" : "/login");
}
