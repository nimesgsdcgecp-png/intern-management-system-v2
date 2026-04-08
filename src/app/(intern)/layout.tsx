import { RoleGuard } from "@/components/layout/RoleGuard";

export default function InternLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={["INTERN"]}>
      {children}
    </RoleGuard>
  );
}
