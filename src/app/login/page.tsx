import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthSplitLayout } from "@/components/layout/auth-split-layout";
import { LoginForm } from "@/components/auth/login-form";
import { auth } from "../../../auth";

export const metadata = {
  title: "Sign In",
};

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/account");
  }

  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID);

  return (
    <AuthSplitLayout eyebrow="Welcome Back" title="Sign In to Your Account">
      <Suspense>
        <LoginForm googleEnabled={googleEnabled} />
      </Suspense>
    </AuthSplitLayout>
  );
}
