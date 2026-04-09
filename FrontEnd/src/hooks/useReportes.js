import { useEffect, useState } from "react";
import { getReportes } from "../api/controllers/Presupuesto";

export default function useReportes(search = "", clienteId = null) {
  const [reportes, setReportes] = useState([]);
  const [allReportes, setAllReportes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReportes = async () => {
    setLoading(true);
    console.log("📡 Fetching reportes...");
    try {
      const data = await getReportes(search);
      console.log("📥 Reportes recibidos:", data?.length);
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
    console.log("🔄 Effect triggered - search:", search, "clienteId:", clienteId);
    fetchReportes();
  }, [search, clienteId]);

  // Filtrar localmente por ID del cliente cuando cambian los datos o el cliente
  useEffect(() => {
    console.log("🔍 Filtrando - clienteId:", clienteId, "data length:", allReportes?.length);
    
    if (!allReportes || allReportes.length === 0) {
      console.log("⚠️ No hay datos para filtrar");
      setReportes([]);
      return;
    }
    
    // Mostrar los primeros reportes para debug
    console.log("📋 Primer reporte:", allReportes[0]);
    console.log("📋 Cliente del primer reporte:", allReportes[0]?.cliente);
    
    if (clienteId) {
      const filtered = allReportes.filter(r => {
        const match = String(r.cliente) === String(clienteId);
        console.log(`  Comparando: r.cliente=${r.cliente} (${typeof r.cliente}) vs clienteId=${clienteId} (${typeof clienteId}) = ${match}`);
        return match;
      });
      console.log("✅ Filtrado:", filtered.length, "reportes para cliente", clienteId);
      setReportes(filtered);
    } else {
      console.log("📋 Sin filtro, mostrando todos:", allReportes.length);
      setReportes(allReportes);
    }
  }, [clienteId, allReportes]);

  return {
    reportes,
    loading,
    error,
    refetch: fetchReportes,
  };
}
