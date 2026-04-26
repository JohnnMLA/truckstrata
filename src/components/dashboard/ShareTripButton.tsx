import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Copy, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface Props {
  shareToken: string | null | undefined;
  tripLabel: string;
}

export function ShareTripButton({ shareToken, tripLabel }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!shareToken) return null;

  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/track/${shareToken}`
      : `/track/${shareToken}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Tracking link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — select and copy manually");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
          title="Share tracking link"
        >
          <Share2 className="h-3.5 w-3.5" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share tracking link</DialogTitle>
          <DialogDescription>
            Anyone with this link can view live status for{" "}
            <span className="font-medium text-foreground">{tripLabel}</span>. No
            login required.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={url}
            onFocus={(e) => e.currentTarget.select()}
            className="flex-1 rounded-md border border-border/60 bg-background px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <Button onClick={copy} size="sm" className="gap-1.5">
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" /> Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" /> Copy
              </>
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Tip: text or email this link to your customer or shipper.
        </p>
      </DialogContent>
    </Dialog>
  );
}
