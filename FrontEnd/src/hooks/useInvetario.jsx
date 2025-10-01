import { useState, useEffect, useCallback } from "react";
import {
  getEpp,
  getStock,
  getConsumibles,
} from "../api/controllers/Inventario";

const controllerMap = {
  epp: getEpp,
  stock: getStock,
  consumibles: getConsumibles,
};

const useInventario = (tipo) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const controller = controllerMap[tipo];
      if (!controller) throw new Error("Tipo de inventario no válido");
      const result = await controller();
      setData(result);
      setError("");
    } catch (err) {
      setError(err.message || "Error al obtener datos");
    } finally {
      setLoading(false);
    }
  }, [tipo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

export default useInventario;
