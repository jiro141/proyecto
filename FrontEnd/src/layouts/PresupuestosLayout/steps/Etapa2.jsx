import React, { useState } from "react";
import InventarioTable from "../components/InventarioTable";
import useInventario from "../../../hooks/useInvetario";

/**
 * 🧩 Etapa2 – Materiales del Presupuesto
 * Conectada con el formData global del layout principal.
 */
export const Etapa2 = ({ formData, setFormData, onStockInsuficiente }) => {
  const [searchEpp, setSearchEpp] = useState("");
  const [searchStock, setSearchStock] = useState("");
  const [searchCons, setSearchCons] = useState("");

  // 🔹 Hooks de inventario por tipo
  const { data: epp } = useInventario("epp", searchEpp);
  const { data: stock } = useInventario("stock", searchStock);
  const { data: consumibles } = useInventario("consumibles", searchCons);

  /**
   * 🧩 handleCantidadChange
   * Actualiza el formData sin mezclar arrays
   */
  const handleCantidadChange = (tipo, id, cantidad, dataset) => {
    setFormData((prev) => {
      // Tipo mapeado al campo correcto dentro de formData
      const tipoMap = {
        epps: "epps",
        stock: "stock_almacen",
        consumibles: "consumibles",
      };

      const key = tipoMap[tipo];
      const arrayActual = [...(prev[key] || [])];

      // Producto base desde la data del inventario actual
      const producto = dataset.find((item) => item.id === id);
      if (!producto) return prev;

      // Si cantidad 0 → eliminar
      const idx = arrayActual.findIndex((item) => item.id === id);
      if (cantidad <= 0) {
        if (idx !== -1) arrayActual.splice(idx, 1);
      } else {
        const actualizado = { ...producto, cantidad };
        if (idx === -1) arrayActual.push(actualizado);
        else arrayActual[idx] = actualizado;
      }

      return { ...prev, [key]: arrayActual };
    });
  };

  return (
    <div className="grid grid-cols-2 gap-8">
      {/* === EPP === */}
      <InventarioTable
        tipo="EPP"
        data={epp || []}
        onSearch={setSearchEpp}
        onCantidadChange={(id, cantidad) =>
          handleCantidadChange("epps", id, cantidad, epp || [])
        }
        onStockInsuficiente={(producto) =>
          onStockInsuficiente("EPP", producto)
        }
      />

      {/* === FERRETERÍA === */}
      <InventarioTable
        tipo="stock"
        data={stock || []}
        onSearch={setSearchStock}
        onCantidadChange={(id, cantidad) =>
          handleCantidadChange("stock", id, cantidad, stock || [])
        }
        onStockInsuficiente={(producto) =>
          onStockInsuficiente("stock", producto)
        }
      />

      {/* === CONSUMIBLES === */}
      <div className="col-span-2">
        <InventarioTable
          tipo="consumibles"
          data={consumibles || []}
          onSearch={setSearchCons}
          onCantidadChange={(id, cantidad) =>
            handleCantidadChange("consumibles", id, cantidad, consumibles || [])
          }
          onStockInsuficiente={(producto) =>
            onStockInsuficiente("consumibles", producto)
          }
        />
      </div>
    </div>
  );
};
