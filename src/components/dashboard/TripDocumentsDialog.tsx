import { useState } from "react";
import { FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TripDocuments } from "./TripDocuments";
import type { TripDocumentKind } from "@/hooks/useTripDocuments";

interface Props {
  tripId: string;
  organizationId: string;
  tripLabel?: string;
  trigger?: React.ReactNode;
  canUpload?: boolean;
  canDelete?: boolean;
  allowedKinds?: TripDocumentKind[];
}

export function TripDocumentsDialog({
  tripId,
  organizationId,
  tripLabel,
  trigger,
  canUpload,
  canDelete,
  allowedKinds,
}: Props) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="ghost" className="rounded-full">
            <FileText className="mr-1 h-3.5 w-3.5" />
            Docs
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Trip documents</DialogTitle>
          {tripLabel && <DialogDescription>{tripLabel}</DialogDescription>}
        </DialogHeader>
        {open && (
          <TripDocuments
            tripId={tripId}
            organizationId={organizationId}
            canUpload={canUpload}
            canDelete={canDelete}
            allowedKinds={allowedKinds}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
