import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export default function NotFound() {
  return (
    <div className="max-w-lg mx-auto px-4 py-24">
      <EmptyState
        title="PAGE NOT FOUND"
        description="This page doesn't exist or has been moved."
        action={
          <Link href="/shop">
            <Button>BROWSE INVENTORY</Button>
          </Link>
        }
      />
    </div>
  );
}
