import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
 const session = await auth().catch(() => null);

 if (session?.user && session.error !== "RefreshAccessTokenError") {
  redirect("/dashboard");
 }

 redirect("/login");
}
