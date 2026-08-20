import { useCallback, useEffect, useState } from "react";
import { getFacturas } from "../api/controllers/Facturas";

export default function useFacturas(search = "") {
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFacturas = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getFacturas(search);
      setFacturas(data || []);
    } catch (err) {
      console.error("❌ Error fetching facturas:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchFacturas();
  }, [fetchFacturas]);

  return {
    facturas,
    loading,
    error,
    refetch: fetchFacturas,
  };
}