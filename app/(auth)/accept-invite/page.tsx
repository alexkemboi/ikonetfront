import { previewInvitation } from "@/actions/usersAccess";
import AcceptInviteForm from "./_components/AcceptInviteForm";

export const metadata = { title: "Accept invitation" };

/** Opened from an invitation email: shows what the link offers, then the person chooses a username and password. */
export default async function AcceptInvitePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  const preview = token ? await previewInvitation(token) : null;

  return (
    <div className="space-y-8">
      <div className="space-y-1.5">
        <h2 className="text-2xl font-normal tracking-normal text-foreground">Accept your invitation</h2>
        <p className="text-sm text-muted-foreground">Choose the username and password you will sign in with.</p>
      </div>
      {preview?.success && preview.data ? (
        <AcceptInviteForm token={token} invitation={preview.data} />
      ) : (
        <div role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">
          {token
            ? preview?.message || "This invitation link is not valid."
            : "This page needs the link from your invitation email. Open the whole link from the email."}
        </div>
      )}
    </div>
  );
}
