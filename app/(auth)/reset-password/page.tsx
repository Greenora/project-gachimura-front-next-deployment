import type { Metadata } from "next";
import PasswordResetForm from "@/components/auth/PasswordResetForm";

export const metadata: Metadata = { referrer: "no-referrer" };

export default function PasswordResetPage() {
  return <PasswordResetForm />;
}
