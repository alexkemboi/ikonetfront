import { Skeleton } from "@/components/ui/skeleton";

/** Shown inside the Users & Access Control layout while a tab loads. */
export default function UsersAccessLoading() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-18 rounded-xl" />)}
      </div>
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-96 w-full rounded-xl" />
    </div>
  );
}
