import BottomNav from "@/components/BottomNav";
import CommunityPopup from "@/components/CommunityPopup";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <BottomNav />
      <CommunityPopup />
    </>
  );
}
