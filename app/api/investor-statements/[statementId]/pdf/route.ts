import { auth } from "@/lib/auth";
import { buildApiUrl } from "@/lib/constants";
import { withCompanyContext } from "@/lib/companyContext";

export const dynamic = "force-dynamic";

/**
 * A month-end statement as a PDF. An investor gets their own (GET /investor/statements/{id}/pdf);
 * a SYSADMIN or company admin any they may see (GET /investors/statements/{id}/pdf). The API
 * decides: another investor's or another company's statement answers "not found".
 */
export async function GET(_request: Request, { params }: { params: Promise<{ statementId: string }> }): Promise<Response> {
  const { statementId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(statementId)) return new Response("Not found", { status: 404 });

  const session = await auth();
  if (!session?.user?.apiToken) return new Response("Not signed in", { status: 401 });

  // an investor login reads its own statement; staff read through the investor register
  const investor = session.user.principalType === "INVESTOR";
  const path = investor ? `/investor/statements/${statementId}/pdf` : `/investors/statements/${statementId}/pdf`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${session.user.apiToken}`,
    Accept: "application/pdf, application/json",
  };
  if (!investor) await withCompanyContext(headers);

  try {
    const upstream = await fetch(buildApiUrl(path), { headers, cache: "no-store" });
    const out = new Headers({ "Cache-Control": "no-store" });
    const type = upstream.headers.get("Content-Type");
    const disposition = upstream.headers.get("Content-Disposition");
    if (type) out.set("Content-Type", type);
    if (disposition) out.set("Content-Disposition", disposition);
    return new Response(await upstream.arrayBuffer(), { status: upstream.status, headers: out });
  } catch {
    return new Response("The server could not be reached", { status: 502 });
  }
}
