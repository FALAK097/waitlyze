import { redirect } from "next/navigation";

export const metadata = { title: "Developer settings" };

export default function ApiKeysPage() {
  redirect("/settings#developers");
}
