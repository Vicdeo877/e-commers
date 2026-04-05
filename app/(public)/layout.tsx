import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import MaintenanceGate from "@/components/MaintenanceGate";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <MaintenanceGate>
      <>
        <Navbar />
        <CartDrawer />
        <main className="flex-1">{children}</main>
        <Footer />
      </>
    </MaintenanceGate>
  );
}
