import AccountNotifications from "@/components/account/AccountNotifications";
import { AccountOverview } from "@/components/account/AccountOverview";

export default function AccountPage() {
  return (
    <div className="space-y-10">
      <AccountNotifications />
      <AccountOverview />
    </div>
  );
}
