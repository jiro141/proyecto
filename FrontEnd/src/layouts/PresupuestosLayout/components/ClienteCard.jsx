import { useState } from "react";
import {
  FaUser,
  FaTimes,
  FaPhone,
  FaEnvelope,
  FaIdCard,
  FaMapMarkerAlt,
} from "react-icons/fa";
import useClientes from "../../../hooks/useClientes";

export default function ClienteCard({ onClienteSelect, defaultCliente = null }) {
  const [search, setSearch] = useState("");
  const [selectedCliente, setSelectedCliente] = useState(defaultCliente);
  const { clientes, loading, error } = useClientes(search);

  const handleSelect = (cliente) => {
    setSelectedCliente(cliente);
    if (onClienteSelect) onClienteSelect(cliente);
  };

  const handleClear = () => {
    setSelectedCliente(null);
    setSearch("");
    if (onClienteSelect) onClienteSelect(null);
  };

  return (
    <div
      className="relative bg-white shadow-md rounded-lg p-4 pt-10 overflow-visible transition-all duration-200"
      style={{
        minHeight: "200px",
        maxHeight: "200px",
      }}
    >
      {/* Icono flotante */}
      <div
        className="absolute -top-4 left-5 w-12 h-12 flex items-center justify-center rounded-lg z-[5] shadow-md"
        style={{
          backgroundColor: "#0B2C4D",
          color: "white",
        }}
      >
        <FaUser size={20} />
      </div>

      {/* Contenido principal */}
      <div className="pt-2 h-full flex flex-col">
        <p className="text-sm text-gray-500 mb-1">Seleccionar Cliente</p>

        {selectedCliente ? (
          <div className="flex flex-col mt-1 flex-grow justify-between">
            {/* Datos del cliente en dos columnas */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[15px]">
              {/* Columna izquierda */}
              <div className="flex flex-col space-y-1">
                <p className="text-lg font-semibold text-gray-800 truncate">
                  {selectedCliente.nombre}
                </p>

                <p className="text-gray-700 flex items-center gap-2">
                  <FaUser className="text-gray-500" size={13} />
                  <span>
                    <span className="font-medium text-gray-800">
                      {selectedCliente.encargado || "—"}
                    </span>
                  </span>
                </p>

                <p className="text-gray-700 flex items-center gap-2">
                  <FaPhone className="text-gray-500" size={13} />
                  <span className="font-medium text-gray-800">
                    {selectedCliente.telefono || "—"}
                  </span>
                </p>
              </div>

              {/* Columna derecha */}
              <div className="flex flex-col space-y-1">
                {selectedCliente.rif && (
                  <p className="text-gray-700 flex items-center gap-2">
                    <FaIdCard className="text-gray-500" size={13} />
                    <span className="font-medium text-gray-800">
                      {selectedCliente.rif}
                    </span>
                  </p>
                )}

                {selectedCliente.correo_electronico && (
                  <p
                    className="text-gray-700 flex items-center gap-2 truncate"
                    title={selectedCliente.correo_electronico}
                  >
                    <FaEnvelope className="text-gray-500" size={13} />
                    <span className="font-medium text-gray-800">
                      {selectedCliente.correo_electronico}
                    </span>
                  </p>
                )}

                {selectedCliente.direccion && (
                  <p
                    className="text-gray-700 flex items-start gap-2 truncate"
                    title={selectedCliente.direccion}
                  >
                    <FaMapMarkerAlt className="text-gray-500 mt-0.5" size={13} />
                    <span className="font-medium text-gray-800">
                      {selectedCliente.direccion}
                    </span>
                  </p>
                )}
              </div>
            </div>

            {/* Botón limpiar */}
            <div className="flex justify-end mt-3">
              <button
                onClick={handleClear}
                className="p-2 rounded-full hover:bg-gray-200 transition"
                title="Quitar cliente"
              >
                <FaTimes className="text-gray-600" size={16} />
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Input de búsqueda */}
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-400"
            />

            {/* Estados */}
            {loading && (
              <p className="text-sm text-gray-400 mt-2">Buscando clientes...</p>
            )}
            {error && (
              <p className="text-sm text-red-500 mt-2">
                Error al cargar clientes.
              </p>
            )}

            {/* Lista de resultados */}
            {!loading && clientes?.length > 0 && (
              <ul className="border border-gray-200 rounded-lg mt-2 max-h-[60px] overflow-y-auto shadow-sm">
                {clientes.map((cliente) => (
                  <li
                    key={cliente.id}
                    onClick={() => handleSelect(cliente)}
                    className="px-3 py-2 hover:bg-blue-100 cursor-pointer text-gray-700"
                  >
                    <p className="font-medium text-[15px]">{cliente.nombre}</p>
                    <p className="text-xs text-gray-500">
                      {cliente.encargado || "Sin encargado"}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            {!loading && search && clientes?.length === 0 && (
              <p className="text-sm text-gray-400 mt-2">
                No se encontraron clientes.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
