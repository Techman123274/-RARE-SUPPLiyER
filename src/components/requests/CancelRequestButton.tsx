"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { cancelMyRequest } from "@/app/request/actions";

export function CancelRequestButton({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button
        type="button"
        variant="outline"
        size="sm"
        loading={loading}
        onClick={async () => {
          setLoading(true);
          const result = await cancelMyRequest(requestId);
          setLoading(false);
          if (!result.ok) {
            setError(result.error ?? "Could not cancel this request.");
            return;
          }
          router.refresh();
        }}
      >
        CANCEL REQUEST
      </Button>
    </div>
  );
}
