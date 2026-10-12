import { HugeiconsIcon } from "@hugeicons/react";
import { Loading02Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

function Spinner({ className, ...props }) {
    return (<HugeiconsIcon icon={Loading02Icon} data-slot="spinner" role="status" aria-label="Loading" className={cn("size-4 animate-spin", className)} {...props} />);
}
export { Spinner };
