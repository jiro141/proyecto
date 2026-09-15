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
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ count: 0, totalPages: 1 });

  const fetchData = useCallback(async (pageNum = 1) => {
    try {
      setLoading(true);
      const result = await getCuentasPorCliente(pageNum);
      setClientes(result.clientes || []);
      setTotales(result.totales || { total_facturado: 0, total_abonado: 0, total_pendiente: 0 });
      setPagination({
        count: result.count || 0,
        totalPages: result.totalPages || 1,
      });
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(1);
  }, [fetchData]);

  useEffect(() => {
    fetchData(page);
  }, [page]);

  const setPageAndFetch = (newPage) => {
    setPage(newPage);
  };

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
    refetch: () => fetchData(page),
    page,
    setPage: setPageAndFetch,
    pagination,
    getDetalleCliente,
  };
}
