import { Bell, Check, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  type DBNotification,
} from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";

export function NotificationBell() {
  const { data: items } = useNotifications();
  const markAll = useMarkAllNotificationsRead();
  const markOne = useMarkNotificationRead();

  // Only count notifications that have actually been "sent"
  const sent = (items ?? []).filter((n) => n.sent_at);
  const unread = sent.filter((n) => !n.read_at).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-card text-muted-foreground transition hover:text-foreground"
        >
          <Bell className="h-4 w-4" strokeWidth={1.8} />
          {unread > 0 && (
            <span className="absolute right-0 top-0 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border/60 px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Notifications
          </p>
          {unread > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => markAll.mutate()}
            >
              <CheckCheck className="mr-1 h-3 w-3" /> Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {sent.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-muted-foreground">
              You're all caught up.
            </div>
          ) : (
            sent.map((n) => (
              <Item key={n.id} n={n} onRead={() => markOne.mutate(n.id)} />
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Item({ n, onRead }: { n: DBNotification; onRead: () => void }) {
  const tone =
    n.type === "trip_assignment"
      ? "bg-primary/10 text-primary"
      : n.type === "trip_reminder"
        ? "bg-warning/15 text-warning"
        : "bg-muted text-muted-foreground";
  return (
    <div
      className={`flex gap-3 border-b border-border/40 px-3 py-2.5 last:border-0 ${
        !n.read_at ? "bg-background/40" : ""
      }`}
    >
      <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${tone}`} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{n.title}</p>
        {n.body && (
          <p className="line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
        )}
        <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
          {n.sent_at
            ? formatDistanceToNow(new Date(n.sent_at), { addSuffix: true })
            : ""}
        </p>
      </div>
      {!n.read_at && (
        <button
          onClick={onRead}
          aria-label="Mark read"
          className="self-start text-muted-foreground transition hover:text-foreground"
        >
          <Check className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
