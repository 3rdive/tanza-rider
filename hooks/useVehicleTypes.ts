import { useState, useEffect, useCallback } from "react";
import { riderService, IVehicleType } from "@/lib/api";

export const useVehicleTypes = () => {
  const [vehicleTypes, setVehicleTypes] = useState<IVehicleType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVehicleTypes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await riderService.getVehicleTypes();
      const activeTypes = (response.data || []).filter(
        (type) => type.isActive && !type.deletedAt
      );
      setVehicleTypes(activeTypes);
    } catch (err: any) {
      console.error("Error fetching vehicle types:", err);
      setError(err?.message || "Failed to fetch vehicle types");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicleTypes();
  }, [fetchVehicleTypes]);

  return {
    vehicleTypes,
    loading,
    error,
    refetch: fetchVehicleTypes,
  };
};
