import React, { useEffect, useState } from "react";
import { BounceLoader } from "react-spinners";
import {
  FaSearch,
  FaMoneyBillWave,
  FaBuilding,
  FaChevronDown,
  FaChevronUp,
  FaFileInvoiceDollar,
} from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getPresupuestosDisponibles, getFacturas, anularFactura } from "../../api/controllers/Facturas";
import CrearFacturaModal from "./CrearFacturaModal";
import FacturaDetalleModal from "./components/FacturaDetalleModal";
import VerFacturasModal from "./components/VerFacturasModal";

const formatCurrency = (value) => {
  const num = parseFloat(value);
  return isNaN(num)
    ? "$0.00"
    : `$${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export default function CrearFacturaLayout() {
  const [presupuestos, setPresupuestos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState({});
  const [selectedPresupuestos, setSelectedPresupuestos] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [verFacturasReporte, setVerFacturasReporte] = useState(null);
  const [verFacturasList, setVerFacturasList] = useState([]);
  const [verFacturasLoading, setVerFacturasLoading] = useState(false);
  const [detalleFactura, setDetalleFactura] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getPresupuestosDisponibles();
      setPresupuestos(Array.isArray(data) ? data : []);
      setSelectedIds([]);
      setSelectedPresupuestos(null);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar los presupuestos disponibles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // ── "Ver factura(s)": lista las facturas de un presupuesto facturado completo ──
  const openVerFacturas = async (reporte) => {
    setVerFacturasReporte(reporte);
    setVerFacturasLoading(true);
    setVerFacturasList([]);
    try {
      const facturas = await getFacturas("", reporte.id);
      setVerFacturasList(Array.isArray(facturas) ? facturas : []);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar las facturas del presupuesto");
    } finally {
      setVerFacturasLoading(false);
    }
  };

  const closeVerFacturas = () => {
    setVerFacturasReporte(null);
    setVerFacturasList([]);
    setDetalleFactura(null);
  };

  const handleAnularFactura = async (facturaId) => {
    try {
      await anularFactura(facturaId);
      toast.success("Factura anulada correctamente");
      setDetalleFactura(null);
      if (verFacturasReporte) {
        const facturas = await getFacturas("", verFacturasReporte.id);
        setVerFacturasList(Array.isArray(facturas) ? facturas : []);
      }
      load();
    } catch (error) {
      console.error(error);
      toast.error("Error al anular la factura");
    }
  };

  // Agrupar por cliente (mismo patrón que "resumen por cliente")
  const grupos = {};
  presupuestos.forEach((p) => {
    const key = p.cliente_id || p.cliente_nombre || "sin-cliente";
    if (!grupos[key]) {
      grupos[key] = {
        cliente_id: key,
        nombre: p.cliente_nombre,
        rif: p.cliente_rif,
        reportes: [],
      };
    }
    grupos[key].reportes.push(p);
  });
  const gruposArr = Object.values(grupos);

  const filteredGrupos = gruposArr.filter((g) => {
    const s = search.toLowerCase();
    if (!s) return true;
    return (
      (g.nombre || "").toLowerCase().includes(s) ||
      (g.rif || "").toLowerCase().includes(s) ||
      g.reportes.some((r) => (r.n_presupuesto || "").toLowerCase().includes(s))
    );
  });

  const totalPresupuestos = presupuestos.filter((p) => !p.facturado_completo).length;
  // Los presupuestos facturados_completos ya NO aportan a la disponibilidad:
  // solo se suma total_reporte de los que aún tienen saldo por facturar.
  const totalDisponible = presupuestos.reduce(
    (acc, p) =>
      acc + (p.facturado_completo ? 0 : parseFloat(p.total_reporte) || 0),
    0
  );

  const toggleClient = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // ── Selección múltiple de presupuestos (mismo cliente) ──
  const toggleSeleccion = (reporteId) => {
    setSelectedIds((prev) =>
      prev.includes(reporteId)
        ? prev.filter((id) => id !== reporteId)
        : [...prev, reporteId]
    );
  };

  const toggleTodosGrupo = (grupo) => {
    const facturables = grupo.reportes
      .filter((r) => !r.facturado_completo)
      .map((r) => r.id);
    const todosSeleccionados = facturables.every((id) => selectedIds.includes(id));
    setSelectedIds((prev) =>
      todosSeleccionados
        ? prev.filter((id) => !facturables.includes(id))
        : [...new Set([...prev, ...facturables])]
    );
  };

  const seleccionadosPresupuestos = presupuestos.filter((p) =>
    selectedIds.includes(p.id)
  );

  // Verificar que todos los seleccionados sean del mismo cliente
  const clienteUnicoSeleccion =
    new Set(seleccionadosPresupuestos.map((p) => p.cliente_id)).size <= 1;

  const handleFacturarSeleccion = () => {
    if (seleccionadosPresupuestos.length === 0) {
      toast.warning("Seleccioná al menos un presupuesto para facturar");
      return;
    }
    if (!clienteUnicoSeleccion) {
      toast.error(
        "Todos los presupuestos de una factura deben pertenecer al mismo cliente."
      );
      return;
    }
    setSelectedPresupuestos(seleccionadosPresupuestos);
  };

  const handleClickPresupuesto = (reporte) => {
    if (reporte.facturado_completo) {
      openVerFacturas(reporte);
      return;
    }
    // Un solo click en "Facturar" → factura individual; los checks → multi
    setSelectedPresupuestos([reporte]);
  };

  return (
    <div className="p-4 space-y-4">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Cards de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#0b2c4d] text-white rounded-lg p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-full p-3">
              <FaFileInvoiceDollar size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-300">Presupuestos Disponibles</p>
              <p className="text-xl font-bold">{totalPresupuestos}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#e53935] text-white rounded-lg p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-full p-3">
              <FaMoneyBillWave size={24} />
            </div>
            <div>
              <p className="text-sm text-red-100">Total Disponible</p>
              <p className="text-xl font-bold">{formatCurrency(totalDisponible)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de clientes */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <BounceLoader color="#0b2c4d" size={80} />
        </div>
      ) : filteredGrupos.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          {search
            ? "No hay clientes que coincidan con la búsqueda"
            : "No hay presupuestos ejecutados para facturar"}
        </div>
      ) : (
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg bg-white">
          <div className="px-6 py-4 bg-[#0b2c4d] border-b">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <FaBuilding size={18} />
                Facturación - Presupuestos por Cliente
              </h2>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <FaSearch
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={14}
                  />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar cliente o presupuesto..."
                    className="pl-8 pr-3 py-1 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-black"
                  />
                </div>
                <button
                  onClick={handleFacturarSeleccion}
                  disabled={selectedIds.length === 0}
                  className={`font-medium py-2 px-4 rounded flex items-center gap-2 transition ${
                    selectedIds.length > 0
                      ? "bg-[#e53935] hover:bg-[#c2302d] text-white"
                      : "bg-gray-400 text-gray-200 cursor-not-allowed"
                  }`}
                >
                  <FaFileInvoiceDollar size={14} />
                  Facturar seleccionados ({selectedIds.length})
                </button>
              </div>
            </div>
          </div>

          <table className="w-full text-sm text-left text-gray-900">
            <thead className="text-xs uppercase bg-[#0b2c4d] text-white">
              <tr>
                <th className="px-4 py-3 w-8"></th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">RIF</th>
                <th className="px-4 py-3 text-center">Presupuestos</th>
                <th className="px-4 py-3 text-right">Total Disponible</th>
              </tr>
            </thead>
            <tbody>
              {filteredGrupos.map((grupo) => {
                const isExpanded = expanded[grupo.cliente_id];
                return (
                  <React.Fragment key={grupo.cliente_id}>
                    {/* Fila principal del cliente */}
                    <tr
                      className="bg-white border-b hover:bg-gray-50 cursor-pointer transition"
                      onClick={() => toggleClient(grupo.cliente_id)}
                    >
                      <td className="px-4 py-4 text-center">
                        {isExpanded ? (
                          <FaChevronUp className="inline text-gray-500" size={14} />
                        ) : (
                          <FaChevronDown className="inline text-gray-500" size={14} />
                        )}
                      </td>
                      <td className="px-4 py-4 font-medium text-gray-800">
                        {grupo.nombre || "-"}
                      </td>
                      <td className="px-4 py-4 text-gray-600">{grupo.rif || "-"}</td>
                      <td className="px-4 py-4 text-center">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                          {grupo.reportes.length}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right text-gray-800 font-medium">
                        {formatCurrency(
                          grupo.reportes.reduce(
                            (acc, r) =>
                              acc +
                              (r.facturado_completo
                                ? 0
                                : parseFloat(r.total_reporte) || 0),
                            0
                          )
                        )}
                      </td>
                    </tr>

                    {/* Fila expandida con los presupuestos del cliente */}
                    {isExpanded && (
                      <tr key={`${grupo.cliente_id}-detail`}>
                        <td colSpan={5} className="bg-gray-50 px-8 py-4">
                          <div className="border rounded-lg overflow-hidden max-h-80 overflow-y-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-200 text-gray-700 sticky top-0">
                                <tr>
                                  <th className="px-3 py-2 text-center w-8">
                                    <input
                                      type="checkbox"
                                      title="Seleccionar todos los facturables de este cliente"
                                      checked={
                                        grupo.reportes.filter((r) => !r.facturado_completo)
                                          .length > 0 &&
                                        grupo.reportes
                                          .filter((r) => !r.facturado_completo)
                                          .every((r) => selectedIds.includes(r.id))
                                      }
                                      onChange={() => toggleTodosGrupo(grupo)}
                                    />
                                  </th>
                                  <th className="px-4 py-2 text-left">N° Presupuesto</th>
                                  <th className="px-4 py-2 text-left">Descripción</th>
                                  <th className="px-4 py-2 text-right">Total</th>
                                  <th className="px-4 py-2 text-center">Facturar</th>
                                </tr>
                              </thead>
                              <tbody>
                                {grupo.reportes.map((reporte) => (
                                  <tr
                                    key={reporte.id}
                                    onClick={() => handleClickPresupuesto(reporte)}
                                    className="border-b hover:bg-blue-50 cursor-pointer transition"
                                  >
                                    <td className="px-3 py-2 text-center">
                                      {!reporte.facturado_completo && (
                                        <input
                                          type="checkbox"
                                          checked={selectedIds.includes(reporte.id)}
                                          onChange={(e) => {
                                            e.stopPropagation();
                                            toggleSeleccion(reporte.id);
                                          }}
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                      )}
                                    </td>
                                    <td className="px-4 py-2 font-medium text-[#0b2c4d]">
                                      #{reporte.n_presupuesto}
                                    </td>
                                    <td className="px-4 py-2">
                                      {reporte.descripcion || "-"}
                                    </td>
                                    <td className="px-4 py-2 text-right">
                                      {formatCurrency(reporte.total_reporte)}
                                    </td>
                                    <td className="px-4 py-2 text-center">
                                      {reporte.facturado_completo ? (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openVerFacturas(reporte);
                                          }}
                                          className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs transition"
                                        >
                                          Ver factura(s)
                                        </button>
                                      ) : (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedPresupuestos([reporte]);
                                          }}
                                          className="bg-[#0B2C4D] hover:bg-[#143d65] text-white px-3 py-1 rounded text-xs transition"
                                        >
                                          Facturar
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal con la estructura de crear factura */}
      <CrearFacturaModal
        presupuestos={selectedPresupuestos}
        onClose={() => {
          setSelectedPresupuestos(null);
          setSelectedIds([]);
          load();
        }}
      />

      {/* Modal "Ver factura(s)" para presupuestos facturados completos */}
      <VerFacturasModal
        reporte={verFacturasReporte}
        facturas={verFacturasList}
        loading={verFacturasLoading}
        onClose={closeVerFacturas}
        onSelectFactura={(factura) => setDetalleFactura(factura)}
      />

      {/* Modal detalle de una factura desde "Ver factura(s)" */}
      <FacturaDetalleModal
        factura={detalleFactura}
        onClose={() => setDetalleFactura(null)}
        onAnular={handleAnularFactura}
      />
    </div>
  );
}