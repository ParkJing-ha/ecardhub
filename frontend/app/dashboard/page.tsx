import { redirect } from "next/navigation";
import DashboardApp from "../../components/dashboard/DashboardApp";
import { getCurrentUser } from "../../lib/session";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth");
  }

  return (
    <div className="dark" style={{ minHeight: '100vh' }}>
      <DashboardApp user={user} />
    </div>
  );
}
