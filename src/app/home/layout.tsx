import BottomNav from "@/components/BottomNav";
import CommunityPopup from "@/components/CommunityPopup";
import AuthGuard from "@/components/AuthGuard";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      {children}
      <BottomNav />
      <CommunityPopup />
    </AuthGuard>
  );
}
