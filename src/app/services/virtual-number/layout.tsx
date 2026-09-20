import BottomNav from "@/components/BottomNav";

export default function VirtualNumberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <BottomNav />
    </>
  );
}
