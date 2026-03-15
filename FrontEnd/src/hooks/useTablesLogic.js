import { useMemo, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import useDepartamentos from "../hooks/useDepartamentos";
import useUbicaciones from "../hooks/useUbicaciones";
import useLugaresConsumo from "../hooks/useLugaresConsumo";
import useProveedores from "../hooks/useProveedores";
import { deleteItem, createItem } from "../api/controllers/Inventario";
import { toast } from "react-toastify";

const useTablesLogic = ({
  onSearch,
  onAdd,
  tipo,
  refetch,
  taza,
  tazaRefetch,
}) => {
  const location = useLocation();

  const isSubInventario = location.pathname === "/clientes/Cuentas";

  const { departamentos = [] } = useDepartamentos();
  const { ubicaciones = [] } = useUbicaciones();
  const { lugares = [] } = useLugaresConsumo();
  const { proveedores = [] } = useProveedores();

  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [selectedItemName, setSelectedItemName] = useState("");
  const [editando, setEditando] = useState(false);
  const [valorTaza, setValorTaza] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (taza?.valor !== undefined && taza?.valor !== null) {
      setValorTaza(parseFloat(taza.valor));
    }
  }, [taza]);

  useEffect(() => {
    if (!onSearch) return;
    const delay = setTimeout(() => onSearch(query), 500);
    return () => clearTimeout(delay);
  }, [query, onSearch]);

  const idToName = useMemo(
    () => ({
      departamento: (id) =>
        departamentos.find((d) => d.id === id)?.name || `ID: ${id}`,
      ubicacion: (id) =>
        ubicaciones.find((u) => u.id === id)?.name || `ID: ${id}`,
      consumo: (id) =>
        lugares.find((l) => l.id === id)?.name || `ID: ${id}`,
      proveedor: (id) =>
        proveedores.find((p) => p.id === id)?.name || `ID: ${id}`,
    }),
    [departamentos, ubicaciones, lugares, proveedores]
  );

  const handleDeleteClick = (id, name) => {
    setSelectedItemId(id);
    setSelectedItemName(name);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteItem(tipo, selectedItemId);
      refetch && refetch();
    } finally {
      setDeleteModalOpen(false);
      setSelectedItemId(null);
    }
  };

  const handleGuardar = async () => {
    try {
      await createItem("taza", { valor: valorTaza.toString() });
      tazaRefetch && (await tazaRefetch());
      refetch && (await refetch());
      toast.success("Valor de taza actualizado correctamente");
      setEditando(false);
    } catch {
      toast.error("Error al actualizar el valor de taza");
    }
  };

  const formatDisplayValue = (value, colKey) => {
    const resolver = idToName[colKey];
    const resolvedValue = resolver ? resolver(value) : value;

    if (typeof resolvedValue === "object" && resolvedValue !== null) {
      return JSON.stringify(resolvedValue);
    }

    const displayText =
      typeof resolvedValue === "string" && resolvedValue.length > 15
        ? resolvedValue.slice(0, 15) + "..."
        : resolvedValue ?? "—";

    const isMonetary =
      colKey === "costo" ||
      colKey === "utilidad_15" ||
      (colKey === "mts_ml_m2" && resolvedValue !== null);

    return isMonetary ? `$${resolvedValue}` : displayText;
  };

  const handleCellClick = (col, row) => {
    const value = row[col.key];

    if (col.key === "telefono" && value) {
      const phone = String(value).replace(/\D/g, "");
      if (phone) window.open(`https://wa.me/${phone}`, "_blank");
      return;
    }

    onAdd && onAdd(row);
  };

  return {
    isSubInventario,
    query,
    setQuery,
    isDeleteModalOpen,
    setDeleteModalOpen,
    selectedItemName,
    editando,
    setEditando,
    valorTaza,
    setValorTaza,
    handleDeleteClick,
    confirmDelete,
    handleGuardar,
    handleCellClick,
    formatDisplayValue,
  };
};

export default useTablesLogic;
