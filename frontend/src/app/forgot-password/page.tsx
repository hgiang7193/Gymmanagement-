import { Suspense } from "react";
import { ForgotPasswordScreen } from "@/components/auth/forgot-password-screen";

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordScreen />
    </Suspense>
  );
}
