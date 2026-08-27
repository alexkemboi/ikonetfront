import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
 try {
 const session = await auth();
 if (session?.user && session.error !== "RefreshAccessTokenError") {
 redirect("/dashboard");
 }
 } catch {
 // Auth evaluation failed — proceed to /login
 }
 redirect("/login");
}
