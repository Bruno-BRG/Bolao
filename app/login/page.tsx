import { redirect } from "next/navigation";
import { AuthForms } from "@/components/AuthForms";
import { getCurrentUser } from "@/services/auth.service";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  const params = await searchParams;
  return <AuthForms error={params.error} />;
}
