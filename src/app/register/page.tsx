import { redirect } from "next/navigation";
import { AuthSplitLayout } from "@/components/layout/auth-split-layout";
import { RegisterForm } from "@/components/auth/register-form";
import { auth } from "../../../auth";

export const metadata = {
  title: "Create Account",
};

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/account");
  }

  return (
    <AuthSplitLayout eyebrow="Join Us" title="Create Your Account">
      <RegisterForm />
    </AuthSplitLayout>
  );
}
