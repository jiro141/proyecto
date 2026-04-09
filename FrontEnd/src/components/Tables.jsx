import React, { useState } from "react";
import { BounceLoader } from "react-spinners";
import { FaSearch, FaSave, FaSyncAlt } from "react-icons/fa";
import { FaRegTrashCan } from "react-icons/fa6";
import { useLocation } from "react-router-dom";
import Modal from "./Modal";
import useTablesLogic from "../hooks/useTablesLogic";
import PresupuestosLayout from "../layouts/PresupuestosLayout/PresupuestosLayout";
const Tables = ({
  columns,
  data = [],
  loading,
  title,
  onAdd,
  onSearch,
  tipo,
  refetch,
  taza,
  tazaLoading,
  tazaRefetch,
}) => {
  const location = useLocation();
  const isClientesLista = location.pathname === "/clientes/Lista";

  // 🔹 Nuevo estado para modal de reportes
  const [isReportesModalOpen, setIsReportesModalOpen] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);

  const {
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
  } = useTablesLogic({
    onSearch,
    onAdd,
    tipo,
    refetch,
    taza,
    tazaRefetch,
  });

  const extraColumnsCount =
    (!isSubInventario ? 1 : 0) + (isClientesLista ? 1 : 0);

  const handleOpenReportes = (cliente) => {
    console.log("📦 Cliente seleccionado:", cliente);
    setClienteSeleccionado(cliente);
    setIsReportesModalOpen(true);
  };
  return (
    <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
      {/* HEADER */}
      <div className="px-6 py-4 bg-[#0b2c4d] border-b flex justify-between items-center">
        <h2
          className={`text-lg font-semibold text-white ${isSubInventario ? "w-full text-center" : ""
            }`}
        >
          {title}
        </h2>

        {/* CAMPO DE TAZA */}
        {tazaLoading ? (
          <p className="text-gray-300 text-sm">Cargando taza...</p>
        ) : taza ? (
          <div className="flex flex-col gap-2 text-white">
            <div className="flex items-center gap-2">
              <h2 className="text-m font-semibold text-white">Taza:</h2>
              <input
                type="number"
                step="0.0001"
                disabled={!editando}
                value={valorTaza}
                onChange={(e) => setValorTaza(e.target.value)}
                className={`border rounded-lg px-3 py-2 w-28 text-gray-900 ${editando
                    ? "focus:outline-none focus:ring-2 focus:ring-blue-300 border-blue-300"
                    : "bg-gray-100 cursor-not-allowed"
                  }`}
              />
              <h2 className="text-m font-semibold text-white">$</h2>

              {editando ? (
                <button
                  onClick={handleGuardar}
                  className="bg-[#FC3B3C] hover:bg-[#c12c2c] text-white px-3 py-2 rounded-lg flex items-center gap-2 transition"
                >
                  <FaSave size={14} /> Guardar
                </button>
              ) : (
                <button
                  onClick={() => setEditando(true)}
                  className="bg-[#0B2C4D] hover:bg-[#143d65] text-white px-3 py-2 rounded-lg flex items-center gap-2 transition"
                >
                  <FaSyncAlt size={14} /> Editar
                </button>
              )}
            </div>
          </div>
        ) : null}

        {/* BUSCADOR Y BOTÓN */}
        <div className="flex items-center gap-3">
          {onSearch && (
            <div className="relative">
              <FaSearch
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={14}
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar..."
                className="pl-8 pr-3 py-1 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-black"
              />
            </div>
          )}

          {!isSubInventario && (
            <button
              className="bg-[#e53935] hover:bg-[#c2302d] text-white font-medium py-2 px-4 rounded"
              onClick={() => onAdd && onAdd(null)}
            >
              Agregar
            </button>
          )}
        </div>
      </div>

      {/* TABLA */}
      <table className="w-full text-sm text-left text-gray-900">
        <thead className="text-xs uppercase bg-[#0b2c4d] text-white">
          <tr>
            {columns.map((col) => (
              <th key={col.key} scope="col" className="px-6 py-3">
                {col.label}
              </th>
            ))}

            {isClientesLista && (
              <th className="px-6 py-3 text-center">Presupuestos</th>
            )}

            {!isSubInventario && (
              <th className="px-6 py-3 text-right">Eliminar</th>
            )}
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr>
              <td
                colSpan={columns.length + extraColumnsCount}
                className="px-6 py-8"
              >
                <div className="flex justify-center items-center w-full h-full">
                  <BounceLoader color="#0b2c4d" size={80} />
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + extraColumnsCount}
                className="text-center py-6 text-gray-500"
              >
                No hay registros disponibles
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="bg-white border-b hover:bg-gray-50 transition"
              >
                {columns.map((col, colIndex) => (
                  <td
                    key={col.key}
                    onClick={() => handleCellClick(col, row)}
                    className={`px-6 py-4 text-gray-800 cursor-pointer hover:underline ${colIndex === 0
                        ? "font-medium whitespace-nowrap"
                        : ""
                      }`}
                  >
                    {formatDisplayValue(row[col.key], col.key)}
                  </td>
                ))}

                {isClientesLista && (
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleOpenReportes(row)}
                      className="bg-[#0B2C4D] hover:bg-[#143d65] text-white px-3 py-1 rounded text-xs transition"
                    >
                      Ver
                    </button>
                  </td>
                )}

                {!isSubInventario && (
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() =>
                        handleDeleteClick(
                          row.id,
                          row.name || row.descripcion
                        )
                      }
                      className="font-medium text-[#e53935] hover:underline"
                    >
                      <FaRegTrashCan color="#e53935" />
                    </button>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* MODAL CONFIRMACIÓN ELIMINAR */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirmar eliminación"
      >
        <div className="space-y-4">
          <p>
            ¿Estás seguro de eliminar{" "}
            <span className="font-bold text-red-700">
              {selectedItemName}
            </span>
            ?
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setDeleteModalOpen(false)}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-4 py-2 rounded"
            >
              Cancelar
            </button>
            <button
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded"
            >
              Eliminar
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL REPORTES DE CLIENTE */}
      <Modal
        isOpen={isReportesModalOpen}
        onClose={() => setIsReportesModalOpen(false)}
        title={`Presupuestos de ${clienteSeleccionado?.nombre || ""
          }`}
          width={"max-w-6xl"}
          height={"h-[80vh]"}
      >
        <div className="py-6 text-center text-gray-600">
          <PresupuestosLayout clienteSeleccionado={clienteSeleccionado} />
        </div>
      </Modal>
    </div>
  );
};

export default Tables;
