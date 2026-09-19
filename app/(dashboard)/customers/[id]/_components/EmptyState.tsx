import { Inbox, TriangleAlert } from "lucide-react";

interface EmptyStateProps {
  message: string;
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 border border-dashed border-border rounded-lg bg-muted/20 p-8 text-center">
      <Inbox className="h-6 w-6 text-muted-foreground/60" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

interface DataLoadErrorProps {
  message?: string;
}

export function DataLoadError({ message }: DataLoadErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 border border-dashed border-destructive/30 rounded-lg bg-destructive/5 p-8 text-center">
      <TriangleAlert className="h-6 w-6 text-destructive/70" />
      <p className="text-sm text-destructive/90">
        {message ?? "Unable to load data. Please try again."}
      </p>
    </div>
  );
}