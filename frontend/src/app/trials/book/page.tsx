import { ProtectedPage } from "@/components/auth/protected-page";
import { GuestTrialBookingPanel } from "@/components/features/guest-trial-booking-panel";

export default function BookTrialPage() {
  return (
    <ProtectedPage allowedRoles={["GUEST", "MEMBER", "ADMIN", "MANAGER"]}>
      <main className="min-h-screen bg-[linear-gradient(145deg,_#fff0f3_0%,_#ffffff_55%,_#fafafa_100%)]">
        <GuestTrialBookingPanel />
      </main>
    </ProtectedPage>
  );
}
