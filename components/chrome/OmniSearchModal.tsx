"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { searchOmni } from "@/actions/search";
import { listenOmniSearch } from "@/lib/omniSearchEvents";
import type { SearchResultItem } from "@/lib/types/search";

const DEBOUNCE_MS = 180;

const COLOR_CLASSES: Record<string, string> = {
  emerald: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  amber: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  rose: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  zinc: "bg-zinc-500/15 text-zinc-500",
};

const CATEGORY_LABELS: Record<string, string> = {
  SUBSCRIBER: "Subscribers",
  ROUTER: "Routers & CPEs",
  CPE: "Routers & CPEs",
  PAYMENT: "Payments",
  TICKET: "Tickets",
};

const CATEGORY_ORDER = ["SUBSCRIBER", "ROUTER", "CPE", "PAYMENT", "TICKET"];

/**
 * Global Ctrl/Cmd+K omni-search. Fully keyboard accessible: ArrowUp/Down cycle,
 * Enter deep-links, Esc closes. Backed by the company-scoped /api/v1/search.
 */
export default function OmniSearchModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const seqRef = useRef(0);

  const reset = useCallback(() => {
    setQuery("");
    setResults([]);
    setSelected(0);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
        reset();
      }
    };
    window.addEventListener("keydown", onKey);
    const unsubscribe = listenOmniSearch(() => {
      setOpen(true);
      setTimeout(() => inputRef.current?.focus(), 50);
    });
    return () => {
      window.removeEventListener("keydown", onKey);
      unsubscribe();
    };
  }, [open, reset]);

  function handleQueryChange(value: string) {
    setQuery(value);
    if (!value.trim()) {
      setResults([]);
      setSelected(0);
      setLoading(false);
    }
  }

  useEffect(() => {
    const q = query.trim();
    const seq = ++seqRef.current;
    if (!q) {
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      const response = await searchOmni(q);
      if (seqRef.current === seq) {
        setResults(response.results);
        setSelected(0);
        setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const groups = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    items: results.filter((r) => r.category === cat),
  })).filter((g) => g.items.length > 0);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      goTo(results[selected]);
    }
  }

  function goTo(item: SearchResultItem | undefined) {
    if (!item) return;
    setOpen(false);
    reset();
    router.push(item.navigationUrl);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogContent className="top-[12%] max-w-xl translate-y-0">
        <DialogHeader>
          <DialogTitle className="sr-only">Omni Search</DialogTitle>
          <DialogDescription className="sr-only">
            Search subscribers, routers, payments and tickets by phone, receipt, MAC, IP or name.
          </DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search phone, M-Pesa receipt, MAC, IP or name…  (Esc to close)"
            className="h-11 pl-9 pr-10 text-sm"
          />
          {loading && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
        </div>

        <div className="max-h-[50vh] overflow-y-auto pr-1">
          {query.trim() && !loading && results.length === 0 && (
            <p className="px-1 py-4 text-center text-xs text-muted-foreground">
              No matches for “{query.trim()}”.
            </p>
          )}
          {groups.map((group) => (
            <div key={group.category} className="mb-3">
              <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {CATEGORY_LABELS[group.category]}
              </p>
              {group.items.map((item) => {
                const idx = results.indexOf(item);
                const active = idx === selected;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => goTo(item)}
                    onMouseEnter={() => setSelected(idx)}
                    className={`flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-left ${
                      active ? "bg-accent" : "hover:bg-accent/50"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{item.subtitle}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        COLOR_CLASSES[item.statusColor] ?? COLOR_CLASSES.zinc
                      }`}
                    >
                      {item.statusPill}
                    </span>
                    {active && <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <p className="border-t pt-2 text-center text-[10px] text-muted-foreground">
          ↑↓ navigate · Enter open · Esc close
        </p>
      </DialogContent>
    </Dialog>
  );
}