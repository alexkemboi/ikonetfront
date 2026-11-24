import { ShieldCheck } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UsersAccessTabs } from "./_components/UsersAccessTabs";
import { getUsersAccessRights, usersAccessTabs } from "./_lib/access";

/** Users & Access Control: one menu for people, roles, security settings and sign-in activity. */
export default async function UsersAccessLayout({ children }: { children: React.ReactNode }) {
  const tabs = usersAccessTabs(await getUsersAccessRights());
  return (
    <div className="space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <ShieldCheck className="size-4.5 text-primary" aria-hidden />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-normal tracking-normal">Users &amp; Access Control</h1>
          <p className="text-sm text-muted-foreground">
            People, roles, sign-in security and activity for your organisation.
          </p>
        </div>
      </header>
      <UsersAccessTabs tabs={tabs} />
      <TooltipProvider>{children}</TooltipProvider>
    </div>
  );
}
