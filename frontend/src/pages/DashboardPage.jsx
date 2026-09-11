import { useParams } from "react-router-dom";
import ShopDashboard from "../components/ShopDashboard.jsx";

export default function DashboardPage() {
  const { shopId } = useParams();
  return <ShopDashboard shopId={shopId} layout="topnav" />;
}
