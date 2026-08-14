import { AccountNav } from "@/components/account/AccountNav";
import { AccountHeading } from "@/components/account/AccountHeading";

export const metadata = {
  title: "My Account — RARE SUPPLiyER",
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <AccountHeading />
      <AccountNav />
      {children}
    </div>
  );
}
