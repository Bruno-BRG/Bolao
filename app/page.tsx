import { redirect } from "next/navigation";
import { getCurrentUser } from "@/services/auth.service";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) redirect("/palpites");
  redirect("/login");
}
