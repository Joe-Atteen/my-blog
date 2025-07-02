import { AdminHeader } from "@/components/layout/admin-header";
import AdminSession from "@/components/admin-session";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AdminHeader />
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <AdminSession />
        </div>
        <main>{children}</main>
      </div>
    </>
  );
}
