import { requireAdmin } from "@/lib/adminAuth";
import AdminPanel from "./AdminPanel";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();
  return <AdminPanel />;
}
