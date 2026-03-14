import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import AdminPortal from "./pages/AdminPortal";
import UserPortal from "./pages/UserPortal";

export default function App() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const handler = () => setPath(window.location.pathname);
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  const isAdmin = path.startsWith("/admin");

  return (
    <>
      {isAdmin ? <AdminPortal /> : <UserPortal />}
      <Toaster richColors position="top-center" />
    </>
  );
}
