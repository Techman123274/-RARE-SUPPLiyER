import Link from "next/link";
import { AuthShell, AuthMessage } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";

export const metadata = {
  title: "Email Verified — RARE SUPPLiyER",
};

export default function EmailVerifiedPage() {
  return (
    <AuthShell kicker="YOU’RE IN" title="EMAIL VERIFIED">
      <AuthMessage tone="success">
        Your email is verified. You can continue to your account.
      </AuthMessage>
      <div className="mt-6">
        <Link href="/account">
          <Button className="w-full" size="lg">
            GO TO MY ACCOUNT
          </Button>
        </Link>
      </div>
    </AuthShell>
  );
}
