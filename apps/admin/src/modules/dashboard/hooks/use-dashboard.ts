import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import {
  type DashboardOverviewFilters,
  fetchDashboardOverview,
  fetchDashboardPacketLoss,
  type PacketLossFilters,
} from "@/modules/dashboard/api/dashboard.api";

export const DASHBOARD_QUERY_KEY = ["admin", "dashboard"] as const;

export const useDashboardOverviewQuery = (
  filters: DashboardOverviewFilters,
) => {
  const token = useAuthStore((state) => state.accessToken);
  return useQuery({
    queryKey: [...DASHBOARD_QUERY_KEY, "overview", filters],
    queryFn: () => fetchDashboardOverview(token ?? "", filters),
    enabled: Boolean(token),
  });
};

export const useDashboardPacketLossQuery = (filters: PacketLossFilters) => {
  const token = useAuthStore((state) => state.accessToken);
  return useQuery({
    queryKey: [...DASHBOARD_QUERY_KEY, "packet-loss", filters],
    queryFn: () => fetchDashboardPacketLoss(token ?? "", filters),
    enabled: Boolean(token),
  });
};
