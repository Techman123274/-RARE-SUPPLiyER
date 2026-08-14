import { InfoPage } from "@/components/layout/InfoPage";

export const metadata = { title: "Privacy — RARE SUPPLiyER" };

export default function PrivacyPage() {
  return (
    <InfoPage title="Privacy Policy">
      <p>
        Your privacy matters. This placeholder policy will be replaced with a full
        privacy policy before launch.
      </p>
      <p>
        We collect only the information necessary to process orders and improve your
        experience.
      </p>
      <p>We do not sell your personal data to third parties.</p>
      <p className="text-xs text-muted/60 pt-4">
        Consult legal counsel before launch.
      </p>
    </InfoPage>
  );
}
