"use client";

import { useState } from "react";
import { toast } from "sonner";
import { executeRouterAction } from "@/actions/network";
import { RouterAction } from "@/lib/types/network-router";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/providers/PermissionsProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  MoreHorizontal,
  Power,
  RotateCcw,
  WifiOff,
  Wifi,
  ShieldOff,
  RefreshCw,
  Activity,
  Loader2,
} from "lucide-react";

interface ActionMeta {
  action: RouterAction;
  label: string;
  Icon: React.ElementType;
  destructive?: boolean;
  confirmTitle?: string;
  confirmDesc?: string;
}

const ACTIONS: ActionMeta[] = [
  {
    action: "PING",
    label: "Ping",
    Icon: Activity,
  },
  {
    action: "REFRESH",
    label: "Refresh Status",
    Icon: RefreshCw,
  },
  {
    action: "REBOOT",
    label: "Reboot",
    Icon: Power,
    confirmTitle: "Reboot this router?",
    confirmDesc:
      "The router will restart. Connected clients will be temporarily disconnected. This usually takes 1–2 minutes.",
  },
  {
    action: "ENABLE",
    label: "Enable",
    Icon: Wifi,
  },
  {
    action: "DISCONNECT",
    label: "Disconnect Uplink",
    Icon: WifiOff,
    destructive: true,
    confirmTitle: "Disconnect uplink?",
    confirmDesc:
      "This will disable the router's uplink port. All connected clients will lose internet access immediately.",
  },
  {
    action: "DISABLE",
    label: "Disable Router",
    Icon: ShieldOff,
    destructive: true,
    confirmTitle: "Disable this router?",
    confirmDesc:
      "The router will be blocked from the network. Re-enable it manually when needed.",
  },
  {
    action: "RESET",
    label: "Factory Reset",
    Icon: RotateCcw,
    destructive: true,
    confirmTitle: "Factory reset this router?",
    confirmDesc:
      "All configuration will be wiped and the device will return to its factory defaults. This cannot be undone.",
  },
];

interface Props {
  routerId: number;
  routerName: string;
}

export default function RouterActionsMenu({ routerId, routerName }: Props) {
  const [pending, setPending] = useState<RouterAction | null>(null);
  const [confirmAction, setConfirmAction] = useState<ActionMeta | null>(null);
  const perms = usePermissions("/network/routers");

  // Only show actions the user is allowed to perform
  const visibleActions = ACTIONS.filter((a) =>
    a.destructive ? perms.canDelete : perms.canEdit
  );

  if (!perms.canEdit && !perms.canDelete) return null;

  async function runAction(meta: ActionMeta) {
    setPending(meta.action);
    try {
      const result = await executeRouterAction(routerId, {
        action: meta.action,
        notes: "",
      });

      if (result.success) {
        if (meta.action === "PING") {
          toast.success(
            `Ping successful — ${routerName} is reachable.`,
            { description: result.data?.output ?? result.message }
          );
        } else {
          toast.success(
            `${meta.label} executed on ${routerName}.`,
            { description: result.message }
          );
        }
      } else {
        toast.error(`${meta.label} failed.`, {
          description: result.message || "The router did not respond.",
        });
      }
    } catch {
      toast.error("Action could not be completed. Check your connection.");
    } finally {
      setPending(null);
    }
  }

  function handleMenuSelect(meta: ActionMeta) {
    if (meta.confirmTitle) {
      setConfirmAction(meta);
    } else {
      runAction(meta);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5"
            disabled={pending !== null}
          >
            {pending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <MoreHorizontal className="w-3.5 h-3.5" />
            )}
            {pending ? "Running…" : "Actions"}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-48">
          {visibleActions.map((meta, i) => {
            const showSeparator =
              i > 0 && meta.destructive && !visibleActions[i - 1].destructive;
            return (
              <span key={meta.action}>
                {showSeparator && <DropdownMenuSeparator />}
                <DropdownMenuItem
                  className={meta.destructive ? "text-destructive focus:text-destructive" : ""}
                  onSelect={() => handleMenuSelect(meta)}
                  disabled={pending !== null}
                >
                  <meta.Icon className="w-3.5 h-3.5 mr-2 shrink-0" />
                  {meta.label}
                </DropdownMenuItem>
              </span>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Confirm dialog for destructive / impactful actions */}
      <AlertDialog
        open={confirmAction !== null}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmAction?.confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.confirmDesc}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmAction(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className={confirmAction?.destructive ? "bg-destructive hover:bg-destructive/90" : ""}
              onClick={() => {
                if (confirmAction) {
                  runAction(confirmAction);
                  setConfirmAction(null);
                }
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
