import { RoleGuard } from "@/components/layout/RoleGuard";

export default function MentorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={["mentor"]}>
      {children}
    </RoleGuard>
  );
}
