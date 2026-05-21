import { useEffect, useState } from "react";
import { getReportes } from "../api/controllers/Presupuesto";

export default function useReportes(search = "", clienteId = null) {
  const [reportes, setReportes] = useState([]);
  const [allReportes, setAllReportes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReportes = async () => {
    setLoading(true);
    try {
      const data = await getReportes(search, clienteId);
      console.log("Fetched reportes:", data);
      
      setAllReportes(data);
    } catch (err) {
      console.error("❌ Error fetching:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos cuando cambia search O cuando se abre el modal (clienteId cambia)
  useEffect(() => {
    fetchReportes();
  }, [search, clienteId]);

  // Asignar directamente lo recibido del backend
  useEffect(() => {
    setReportes(allReportes || []);
  }, [allReportes]);

  return {
    reportes,
    loading,
    error,
    refetch: fetchReportes,
  };
}
