import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FaSave, FaArrowLeft, FaTrash, FaPlus } from "react-icons/fa";
import BounceLoader from "react-spinners/BounceLoader";
import {
  getFacturas,
  getPendienteFactura,
  createNotaDebito,
} from "../../api/controllers/Facturas";
import { formatMoneda } from "./utils";
import { notifyError } from "../../api/apiErrors";

export default function CrearNotaDebitoLayout() {
  const navigate = useNavigate();

  const [facturas, setFacturas] = useState([]);
  const [loadingFacturas, setLoadingFacturas] = useState(true);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);
  const [pendientes, setPendientes] = useState([]);
  const [loadingPendientes, setLoadingPendientes] = useState(false);

  const [motivo, setMotivo] = useState("");
  const [fecha, setFecha] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [items, setItems] = useState([]);
  const [guardando, setGuardando] = useState(false);

  // Cargar facturas EMITIDAS
  useEffect(() => {
    const fetchFacturas = async () => {
      try {
        const data = await getFacturas("", null, 1);
        // Filtrar solo EMITIDAS
        const emitidas = (data.results || []).filter(
          (f) => f.estado === "EMITIDA"
        );
        setFacturas(emitidas);
      } catch (error) {
        console.error(error);
        notifyError(error, "Error al cargar facturas");
      } finally {
        setLoadingFacturas(false);
      }
    };
    fetchFacturas();
  }, []);

  // Cargar pendientes cuando se selecciona una factura
  useEffect(() => {
    if (!facturaSeleccionada) {
      setPendientes([]);
      return;
    }
    const fetchPendientes = async () => {
      setLoadingPendientes(true);
      try {
        const data = await getPendienteFactura(facturaSeleccionada.reporte);
        setPendientes(data.apus || []);
      } catch (error) {
        console.error(error);
        notifyError(error, "Error al cargar pendientes");
      } finally {
        setLoadingPendientes(false);
      }
    };
    fetchPendientes();
  }, [facturaSeleccionada]);

  const addItem = () => {
    setItems([
      ...items,
      {
        apu_id: null,
        apu_descripcion: "",
        unidad: "",
        cantidad: 1,
        precio_unitario: 0,
      },
    ]);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleSave = async () => {
    if (!facturaSeleccionada) {
      toast.error("Debe seleccionar una factura");
      return;
    }
    if (!motivo.trim()) {
      toast.error("El motivo es obligatorio");
      return;
    }
    if (items.length === 0) {
      toast.error("Debe agregar al menos un item");
      return;
    }

    // Validar items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.apu_descripcion.trim()) {
        toast.error(`El item ${i + 1} debe tener una descripción`);
        return;
      }
      if (item.cantidad <= 0) {
        toast.error(`El item ${i + 1} debe tener una cantidad mayor a 0`);
        return;
      }
      if (item.precio_unitario <= 0) {
        toast.error(`El item ${i + 1} debe tener un precio mayor a 0`);
        return;
      }
    }

    setGuardando(true);
    try {
      const payload = {
        factura: facturaSeleccionada.id,
        fecha,
        motivo,
        moneda: facturaSeleccionada.moneda,
        tasa_bs_usd: facturaSeleccionada.tasa_bs_usd,
        items_data: items.map((item) => ({
          apu_id: item.apu_id || null,
          apu_descripcion: item.apu_descripcion,
          unidad: item.unidad,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
        })),
      };

      await createNotaDebito(payload);
      toast.success("Nota de débito creada exitosamente");
      navigate("/facturas/notas-debito/lista");
    } catch (error) {
      console.error(error);
      notifyError(error, "Error al crear la nota de débito");
    } finally {
      setGuardando(false);
    }
  };

  const subtotal = items.reduce(
    (sum, item) => sum + item.cantidad * item.precio_unitario,
    0
  );
  const iva = subtotal * 0.16;
  const total = subtotal + iva;

  return (
    <div className="p-4 space-y-4">
      <div className="relative overflow-x-auto shadow-md sm:rounded-lg bg-white">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0b2c4d] border-b flex flex-wrap justify-between items-center gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Nueva Nota de Débito
            </h2>
            <p className="text-xs text-gray-300">
              Crear nota de débito asociada a una factura
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/facturas/notas-debito/lista")}
              className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded flex items-center gap-2 transition"
            >
              <FaArrowLeft size={14} />
              Volver
            </button>
            <button
              onClick={handleSave}
              disabled={guardando}
              className="bg-[#e53935] hover:bg-[#c2302d] text-white font-medium py-2 px-4 rounded flex items-center gap-2 transition disabled:opacity-50"
            >
              <FaSave size={14} />
              {guardando ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Selección de factura */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Factura *
              </label>
              {loadingFacturas ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <BounceLoader color="#0b2c4d" size={20} />
                  Cargando facturas...
                </div>
              ) : (
                <select
                  value={facturaSeleccionada?.id || ""}
                  onChange={(e) => {
                    const f = facturas.find(
                      (f) => f.id === parseInt(e.target.value)
                    );
                    setFacturaSeleccionada(f);
                    setItems([]);
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar factura...</option>
                  {facturas.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.n_factura} - {f.cliente_nombre} ({formatMoneda(f.total, f.moneda)})
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha *
              </label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Motivo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivo *
            </label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Describa el motivo de la nota de débito..."
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Info de la factura seleccionada */}
          {facturaSeleccionada && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-bold text-blue-800 mb-2">
                Información de la factura
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <span className="text-blue-600">N° Factura:</span>{" "}
                  <span className="font-medium">{facturaSeleccionada.n_factura}</span>
                </div>
                <div>
                  <span className="text-blue-600">Cliente:</span>{" "}
                  <span className="font-medium">{facturaSeleccionada.cliente_nombre}</span>
                </div>
                <div>
                  <span className="text-blue-600">Moneda:</span>{" "}
                  <span className="font-medium">{facturaSeleccionada.moneda}</span>
                </div>
                <div>
                  <span className="text-blue-600">Total:</span>{" "}
                  <span className="font-medium">
                    {formatMoneda(facturaSeleccionada.total, facturaSeleccionada.moneda)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Items */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                Items
              </h3>
              <button
                onClick={addItem}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-1 px-3 rounded flex items-center gap-1 transition"
              >
                <FaPlus size={12} />
                Agregar item
              </button>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                No hay items. Haga clic en "Agregar item" para comenzar.
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-4 relative"
                  >
                    <button
                      onClick={() => removeItem(index)}
                      className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                    >
                      <FaTrash size={14} />
                    </button>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div className="md:col-span-2">
                        <label className="block text-xs text-gray-500 mb-1">
                          Descripción *
                        </label>
                        <input
                          type="text"
                          value={item.apu_descripcion}
                          onChange={(e) =>
                            updateItem(index, "apu_descripcion", e.target.value)
                          }
                          placeholder="Descripción del item"
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Cantidad *
                        </label>
                        <input
                          type="number"
                          value={item.cantidad}
                          onChange={(e) =>
                            updateItem(
                              index,
                              "cantidad",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          min="0"
                          step="0.01"
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Precio Unitario *
                        </label>
                        <input
                          type="number"
                          value={item.precio_unitario}
                          onChange={(e) =>
                            updateItem(
                              index,
                              "precio_unitario",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          min="0"
                          step="0.01"
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="mt-2 text-right text-sm text-gray-600">
                      Subtotal:{" "}
                      <span className="font-medium">
                        {formatMoneda(
                          item.cantidad * item.precio_unitario,
                          facturaSeleccionada?.moneda || "USD"
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totales */}
          {items.length > 0 && (
            <div className="flex justify-end">
              <div className="w-full max-w-xs space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">
                    {formatMoneda(subtotal, facturaSeleccionada?.moneda || "USD")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">IVA (16%)</span>
                  <span className="font-medium">
                    {formatMoneda(iva, facturaSeleccionada?.moneda || "USD")}
                  </span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold">
                  <span>TOTAL</span>
                  <span className="text-[#0B2C4D]">
                    {formatMoneda(total, facturaSeleccionada?.moneda || "USD")}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
