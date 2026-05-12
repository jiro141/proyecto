import { useEffect, useState, useCallback } from "react";
import { getCuentasPorCliente, getClienteDetalle } from "../api/controllers/Cuentas";

export default function useCuentasPorCliente() {
  const [clientes, setClientes] = useState([]);
  const [totales, setTotales] = useState({
    total_facturado: 0,
    total_abonado: 0,
    total_pendiente: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getCuentasPorCliente();
      setClientes(result.clientes || []);
      setTotales(result.totales || { total_facturado: 0, total_abonado: 0, total_pendiente: 0 });
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Obtener detalle de un cliente específico
  const getDetalleCliente = useCallback(async (clienteId) => {
    try {
      const result = await getClienteDetalle(clienteId);
      return result;
    } catch (err) {
      console.error("Error al obtener detalle del cliente:", err);
      return null;
    }
  }, []);

  return { 
    clientes, 
    totales, 
    loading, 
    error, 
    refetch: fetchData,
    getDetalleCliente 
  };
}