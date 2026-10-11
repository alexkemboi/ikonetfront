import type { ReactNode } from "react";
import { AlertTriangle, Info, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { Panel } from "@/lib/types/analytics";

/** The frame every analytics panel sits in: title (with the period where it applies), helper line, optional action. */
export function PanelCard({
  title,
  period,
  helper,
  action,
  className,
  children,
}: {
  title: string;
  period?: string;
  helper?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("flex min-w-0 flex-col rounded-xl border border-border bg-card p-5", className)}>
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <h3 className="text-sm font-medium text-foreground">
            {title}
            {period && <span className="font-normal text-muted-foreground"> · {period}</span>}
          </h3>
          {helper && <p className="mt-0.5 text-xs text-muted-foreground">{helper}</p>}
        </div>
        {action}
      </header>
      <div className="mt-4 flex min-w-0 flex-1 flex-col">{children}</div>
    </section>
  );
}

/** A panel's quiet message: nothing qualified, the figure failed, or its source is switched off. */
export function PanelNote({ tone = "empty", children }: { tone?: "empty" | "error" | "setup"; children: ReactNode }) {
  const Icon = tone === "error" ? AlertTriangle : tone === "setup" ? Settings2 : Info;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground"
    >
      <Icon className={cn("size-4 shrink-0", tone === "error" && "text-amber-500")} aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

/**
 * Renders a panel's data, or says why there is none. Missing, switched-off and
 * measured-empty are three different messages; none of them is shown as zero.
 */
export function PanelBody<T>({
  panel,
  isEmpty,
  empty,
  children,
}: {
  panel: Panel<T>;
  isEmpty?: (data: T) => boolean;
  empty?: string;
  children: (data: T) => ReactNode;
}) {
  if (panel.status === "NOT_CONFIGURED") {
    return <PanelNote tone="setup">{panel.message ?? "This panel's source is switched off."}</PanelNote>;
  }
  if (panel.status !== "AVAILABLE" || panel.data == null) {
    return <PanelNote tone="error">{panel.message ?? "This figure could not be loaded."}</PanelNote>;
  }
  if (isEmpty?.(panel.data)) {
    return <PanelNote>{empty ?? "Nothing recorded in this period."}</PanelNote>;
  }
  return <>{children(panel.data)}</>;
}

/** A whole section failed to load (the others on the page are unaffected). */
export function SectionError({ message, requestId }: { message: string; requestId?: string }) {
  return (
    <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-sm">
      <p className="font-medium text-foreground">This section could not be loaded.</p>
      <p className="mt-1 text-muted-foreground">
        {message}
        {requestId ? ` · Ref: ${requestId}` : ""}
      </p>
    </div>
  );
}

export function SectionHeading({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2 id={id} className="scroll-mt-40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </h2>
  );
}

/** Loading placeholder for a section: a loading panel is never shown as an empty or zero one. */
export function SectionSkeleton({ label, panels }: { label: string; panels: Array<"wide" | "half"> }) {
  return (
    <div role="status" aria-label={`Loading ${label}`} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {panels.map((span, index) => (
        <div key={index} className={cn("rounded-xl border border-border bg-card p-5", span === "wide" && "lg:col-span-2")}>
          <Skeleton className="h-4 w-40" />
          <Skeleton className="mt-4 h-40 w-full" />
        </div>
      ))}
      <span className="sr-only">Loading {label}…</span>
    </div>
  );
}
