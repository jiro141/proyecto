import { useEffect, useState } from "react";
import { getReportes } from "../api/controllers/Presupuesto";

export default function useReportes(search = "", clienteId = null) {
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReportes = async () => {
    setLoading(true);
    try {
      const data = await getReportes(clienteId);
      setReportes(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!clienteId) return; // ⛔ no cargar si no hay cliente
    fetchReportes();
  }, [search, clienteId]);

  return {
    reportes,
    loading,
    error,
    refetch: fetchReportes,
  };
}
