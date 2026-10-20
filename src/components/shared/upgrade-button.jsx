import { Cancel01Icon, LockIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import Pricing from "@/components/landing/pricing";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export function UpgradeButton({ className }) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 bg-transparent px-2 text-xs text-primary hover:bg-transparent hover:text-primary/80 ${className}`}
          >
            <HugeiconsIcon icon={LockIcon} className="mr-1 h-3 w-3" />
            Upgrade
          </Button>
        }
      />
      <DialogContent className="max-w-5xl">
        <DialogClose className="absolute top-4 right-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <HugeiconsIcon icon={Cancel01Icon} className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>
        <Pricing isModal />
      </DialogContent>
    </Dialog>
  );
}
