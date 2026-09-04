import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import {
  type DeviceHealthFilters,
  fetchDeviceHealth,
  fetchDeviceHealthSummary,
} from "@/modules/reports/api/reports.api";

export const REPORTS_QUERY_KEY = ["admin", "reports"] as const;

export const useDeviceHealthQuery = (filters: DeviceHealthFilters) => {
  const token = useAuthStore((state) => state.accessToken);
  return useQuery({
    queryKey: [...REPORTS_QUERY_KEY, "device-health", filters],
    queryFn: () => fetchDeviceHealth(token ?? "", filters),
    enabled: Boolean(token),
  });
};

export const useDeviceHealthSummaryQuery = (filters: DeviceHealthFilters) => {
  const token = useAuthStore((state) => state.accessToken);
  return useQuery({
    queryKey: [...REPORTS_QUERY_KEY, "device-health-summary", filters],
    queryFn: () => fetchDeviceHealthSummary(token ?? "", filters),
    enabled: Boolean(token),
  });
};
