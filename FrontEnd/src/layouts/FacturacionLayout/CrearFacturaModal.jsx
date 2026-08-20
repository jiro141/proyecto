import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FaSave,
  FaPlus,
  FaTrash,
  FaCheckDouble,
  FaFileInvoiceDollar,
  FaDollarSign,
} from "react-icons/fa";
import BounceLoader from "react-spinners/BounceLoader";
import Modal from "../../components/Modal";
import {
  getPendienteFactura,
  getTasaBCV,
  getFacturaConfig,
  createFactura,
} from "../../api/controllers/Facturas";
import { getReporteDetalle, getClienteById } from "../../api/controllers/Presupuesto";
import {
  formatFecha,
  formatMoneda,
  enmascararFecha,
  esFechaValida,
  toISODate,
  round2,
} from "./utils";
import usePDFFactura from "./hooks/usePDFFactura";

const initialItem = () => ({
  apu_id: null,
  apu_descripcion: "",
  unidad: "",
  cantidad: 1,
  cantidad_pendiente: 0,
  precio_unitario: 0,
});

const hoyStr = () => {
  const now = new Date();
  const d = String(now.getDate()).padStart(2, "0");
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${d}/${m}/${now.getFullYear()}`;
};

export default function CrearFacturaModal({ presupuestos, onClose }) {
  const navigate = useNavigate();
  const listaPresupuestos = Array.isArray(presupuestos) ? presupuestos : [];
  const reporteIds = listaPresupuestos.map((p) => p.id);
  const esMulti = reporteIds.length > 1;
  const { generarPDFFactura, calcularMaxItems } = usePDFFactura();

  // ── Datos de contexto ──
  const [tasaBCV, setTasaBCV] = useState(null);
  const [configFactura, setConfigFactura] = useState(null);

  // ── Presupuestos seleccionados ──
  const [reportesDetalle, setReportesDetalle] = useState([]);
  const [cliente, setCliente] = useState(null);
  const [restanteFacturacion, setRestanteFacturacion] = useState(0);
  const [montoFacturado, setMontoFacturado] = useState(0);
  const [loadingReporte, setLoadingReporte] = useState(false);

  // ── Formulario ──
  const [fecha, setFecha] = useState(hoyStr);
  const [moneda, setMoneda] = useState("USD");
  const [items, setItems] = useState([]);
  const [porcentajeDescuento, setPorcentajeDescuento] = useState("0");
  const [guardando, setGuardando] = useState(false);
  const [numeroFactura, setNumeroFactura] = useState("");
  const [ordenServicio, setOrdenServicio] = useState("");
  const [ordenControl, setOrdenControl] = useState("");

  // ── Modo de facturación: por APUs (default) o por descripción completa ──
  const [modoDescripcionCompleta, setModoDescripcionCompleta] = useState(false);
  const [descCompleta, setDescCompleta] = useState("");
  const [unidadCompleta, setUnidadCompleta] = useState("global");
  const [precioCompleta, setPrecioCompleta] = useState(0);

  // ── Al abrir el modal con presupuesto(s): cargar todo ──
  useEffect(() => {
    if (reporteIds.length === 0) return;
    let cancel = false;

    const load = async () => {
      setLoadingReporte(true);
      setReportesDetalle([]);
      setCliente(null);
      setItems([]);
      setRestanteFacturacion(0);
      setMontoFacturado(0);
      setFecha(hoyStr());
      setMoneda("USD");
      setPorcentajeDescuento("0");
      setNumeroFactura("");
      setOrdenServicio("");
      setOrdenControl("");
      setModoDescripcionCompleta(false);
      setDescCompleta("");
      setUnidadCompleta("global");
      setPrecioCompleta(0);
      try {
        const [tasa, config] = await Promise.all([
          getTasaBCV().catch(() => null),
          getFacturaConfig().catch(() => null),
        ]);
        if (cancel) return;
        setTasaBCV(tasa);
        setConfigFactura(config);
        setNumeroFactura(config?.siguiente_n_factura || "");
        if (!tasa) {
          toast.warning("No se pudo obtener la tasa del BCV. La conversión a Bs puede fallar.");
        }

        // Cargar detalle + pendiente de TODOS los presupuestos seleccionados
        const detallesRes = await Promise.all(
          reporteIds.map((id) => getReporteDetalle(id))
        );
        const pendientesRes = await Promise.all(
          reporteIds.map((id) => getPendienteFactura(id))
        );
        if (cancel) return;

        const primerDetalle = detallesRes[0];
        const clienteRes = await getClienteById(primerDetalle.cliente);
        if (cancel) return;

        setReportesDetalle(detallesRes);
        setCliente(clienteRes);

        // Mezclar los APUs de todos los presupuestos
        const todosApus = [];
        detallesRes.forEach((det) => {
          (det.apus || []).forEach((apu) => {
            // Evitar APUs duplicados (mismo id) entre presupuestos
            if (!todosApus.some((a) => a.id === apu.id)) todosApus.push(apu);
          });
        });

        // Mapa de pendientes por APU (de todos los presupuestos)
        const pendMap = {};
        pendientesRes.forEach((pd) => {
          (pd?.apus || []).forEach((p) => {
            pendMap[p.apu_id] = p;
          });
        });

        // Sumar restantes y montos facturados de todos los presupuestos
        const sumRestante = pendientesRes.reduce(
          (acc, pd) => acc + (Number(pd?.restante_facturacion) || 0),
          0
        );
        const sumFacturado = pendientesRes.reduce(
          (acc, pd) => acc + (Number(pd?.monto_facturado) || 0),
          0
        );
        setRestanteFacturacion(sumRestante);
        setMontoFacturado(sumFacturado);

        // Modo descripción completa: concatenar todas las descripciones y
        // sumar los totales de todos los presupuestos.
        const descs = detallesRes
          .map((det) => det?.descripcion || "")
          .filter((d) => d && d.trim());
        setDescCompleta(descs.join("\n\n"));
        setUnidadCompleta("global");
        const totalCompleta = detallesRes.reduce(
          (acc, det) => acc + (Number(det?.total_reporte) || 0),
          0
        );
        setPrecioCompleta(totalCompleta);

        const nuevosItems = todosApus.map((apu) => {
          const pend = pendMap[apu.id];
          return {
            apu_id: apu.id,
            apu_descripcion: apu.descripcion || "",
            unidad: apu.unidad || "",
            cantidad: 0,
            cantidad_pendiente: Number(pend?.cantidad_pendiente || 0),
            precio_unitario: Number(apu.precio_unitario || 0),
          };
        });
        setItems(nuevosItems);
      } catch (error) {
        console.error("Error cargando presupuesto:", error);
        toast.error("Error al cargar el presupuesto");
      } finally {
        if (!cancel) setLoadingReporte(false);
      }
    };

    load();
    return () => {
      cancel = true;
    };
  }, [reporteIds.join(",")]);

  // ── Cambio de moneda: reconvierte precios ──
  const handleChangeMoneda = (nueva) => {
    if (nueva === moneda) return;
    const factor = Number(tasaBCV?.promedio) || 0;
    if (factor <= 0) {
      toast.error("No hay tasa BCV disponible para convertir");
      return;
    }
    setItems((prev) =>
      prev.map((it) => ({
        ...it,
        precio_unitario:
          nueva === "BS"
            ? round2(it.precio_unitario * factor)
            : round2(it.precio_unitario / factor),
      }))
    );
    setPrecioCompleta((prev) =>
      nueva === "BS" ? round2(prev * factor) : round2(prev / factor)
    );
    setMoneda(nueva);
  };

  // ── Items ──
  const handleItemChange = (index, field, value) => {
    if (field === "cantidad") {
      const actual = items[index];
      const pendiente = Number(actual?.cantidad_pendiente) || 0;
      const tienePendiente = actual?.apu_id && pendiente > 0;
      const parsed = parseFloat(value) || 0;
      if (tienePendiente && parsed > pendiente) {
        toast.warn(`La cantidad no puede ser mayor al pendiente (${pendiente})`);
        const next = [...items];
        next[index] = { ...next[index], cantidad: pendiente };
        setItems(next);
        return;
      }
    }
    setItems((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        [field]:
          field === "apu_descripcion" || field === "unidad"
            ? value
            : parseFloat(value) || 0,
      };
      return next;
    });
  };

  const handleItemCompleto = (index) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        cantidad: next[index].cantidad_pendiente,
      };
      return next;
    });
  };

  const handleAgregarManual = () => {
    setItems((prev) => [...prev, initialItem()]);
  };

  const handleRemoveItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Totales ──
  const totales = useMemo(() => {
    if (modoDescripcionCompleta) {
      const subtotal = round2(Number(precioCompleta) || 0);
      const base = subtotal;
      const iva = (base * 16) / 100;
      return {
        subtotal: round2(subtotal),
        montoDescuento: 0,
        base: round2(base),
        iva: round2(iva),
        total: round2(base + iva),
      };
    }
    const subtotal = items.reduce(
      (s, it) => s + (Number(it.cantidad) || 0) * (Number(it.precio_unitario) || 0),
      0
    );
    const montoDescuento = (subtotal * (Number(porcentajeDescuento) || 0)) / 100;
    const base = subtotal - montoDescuento;
    const iva = (base * 16) / 100;
    return {
      subtotal: round2(subtotal),
      montoDescuento: round2(montoDescuento),
      base: round2(base),
      iva: round2(iva),
      total: round2(base + iva),
    };
  }, [items, porcentajeDescuento, modoDescripcionCompleta, precioCompleta]);

  // Restante por facturar del presupuesto (convertido a la moneda activa)
  const restanteEnMoneda = useMemo(() => {
    const factor = moneda === "BS" ? Number(tasaBCV?.promedio) || 0 : 1;
    return round2((Number(restanteFacturacion) || 0) * factor);
  }, [restanteFacturacion, moneda, tasaBCV]);

  // Monto ya facturado del presupuesto (el backend lo devuelve en USD)
  const montoFacturadoEnMoneda = useMemo(() => {
    const factor = moneda === "BS" ? Number(tasaBCV?.promedio) || 0 : 1;
    return round2((Number(montoFacturado) || 0) * factor);
  }, [montoFacturado, moneda, tasaBCV]);

  const subtotalExcedeRestante = useMemo(() => {
    if (!restanteFacturacion) return false;
    return totales.subtotal > restanteEnMoneda;
  }, [totales.subtotal, restanteEnMoneda, restanteFacturacion]);

  // ── Guardar ──
  const handleSave = async () => {
    if (reporteIds.length === 0) {
      toast.error("Seleccioná al menos un presupuesto para facturar");
      return;
    }
    if (!esFechaValida(fecha)) {
      toast.error("La fecha es obligatoria y debe tener formato DD/MM/AAAA");
      return;
    }
    if (modoDescripcionCompleta) {
      if (!(Number(precioCompleta) > 0)) {
        toast.error("Los presupuestos no tienen un monto total válido");
        return;
      }
      if (!descCompleta?.trim()) {
        toast.error("La descripción completa es obligatoria");
        return;
      }
    } else {
      const itemsValidos = items.filter((it) => (Number(it.cantidad) || 0) > 0);
      if (!itemsValidos.length) {
        toast.error("Debe facturar al menos una cantidad");
        return;
      }
      const exceso = itemsValidos.find(
        (it) => it.apu_id && Number(it.cantidad) > Number(it.cantidad_pendiente)
      );
      if (exceso) {
        toast.error("Algún ítem supera la cantidad pendiente");
        return;
      }

      // Límite físico de ítems para una sola hoja (fuente fija)
      const maxInfo = calcularMaxItems(
        itemsValidos,
        cliente?.direccion || ""
      );
      if (!maxInfo.cabenTodos) {
        toast.error(
          `Límite máximo alcanzado: caben ${maxInfo.maxItems} ítems en una hoja y cargaste ${itemsValidos.length}. Reducí la cantidad o acortá las descripciones.`
        );
        return;
      }
    }
    if (moneda === "BS" && !Number(tasaBCV?.promedio)) {
      toast.error("No hay tasa BCV disponible para facturar en Bs");
      return;
    }

    // Restante de los presupuestos: el subtotal no puede superar lo que falta
    // por facturar (cubre líneas manuales que no descuentan por APU).
    if (restanteFacturacion > 0 && subtotalExcedeRestante) {
      toast.error(
        `El subtotal (${formatMoneda(totales.subtotal, moneda)}) supera el restante por facturar de los presupuestos (${formatMoneda(
          restanteEnMoneda,
          moneda
        )}). Reducí el monto de los ítems.`
      );
      return;
    }

    const fechaTasaISO = tasaBCV?.fechaActualizacion
      ? tasaBCV.fechaActualizacion.slice(0, 10)
      : null;

    const itemsPayload = items
      .filter((it) => (Number(it.cantidad) || 0) > 0)
      .map(
        ({ apu_id, apu_descripcion, unidad, cantidad, precio_unitario }) => ({
          apu_id: apu_id || null,
          apu_descripcion,
          unidad,
          cantidad,
          precio_unitario,
        })
      );

    const payload = {
      reporte: Number(reporteIds[0]),
      reportes: reporteIds.map(Number),
      fecha: toISODate(fecha),
      orden_servicio: ordenServicio?.trim() || "",
      orden_control: ordenControl?.trim() || "",
      moneda,
      // Guardar SIEMPRE la tasa BCV del día de la factura (también en USD),
      // para que el PDF de una factura ya creada use la tasa de ESE día y no
      // haya que consultar la actual cada vez que se regenera.
      tasa_bs_usd: Number(tasaBCV.promedio) || null,
      fecha_tasa: fechaTasaISO,
      porcentaje_descuento: modoDescripcionCompleta
        ? 0
        : Number(porcentajeDescuento) || 0,
      porcentaje_iva: 16,
      monto_iva: totales.iva,
      // Modo descripción completa: el backend construye un ítem por
      // presupuesto (Opción B), así que no se envían items.
      factura_completa: modoDescripcionCompleta,
      items: modoDescripcionCompleta ? [] : itemsPayload,
    };

    setGuardando(true);
    try {
      const creada = await createFactura(payload);
      toast.success(`Factura ${creada.n_factura} creada correctamente`);
      try {
        const pdfRes = generarPDFFactura(creada, {
          descripcion:
            reportesDetalle[0]?.descripcion || listaPresupuestos[0]?.descripcion || "",
          tasaBCV,
        });
        if (!pdfRes.ok) {
          toast.warning(
            "La factura se creó, pero supera el límite de ítems para una sola hoja: no se generó el PDF."
          );
        }
      } catch (pdfError) {
        console.error("Error generando PDF de la factura:", pdfError);
        toast.warning(
          "La factura se creó, pero no se pudo generar el PDF."
        );
      }
      onClose?.();
      navigate("/facturas/lista");
    } catch (error) {
      console.error("Error al crear factura:", error);
      const msg = error.response?.data
        ? JSON.stringify(error.response.data)
        : error.message;
      toast.error(`Error al crear factura: ${msg}`);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      isOpen={presupuestos && presupuestos.length > 0}
      onClose={onClose}
      title={`Nueva Factura — ${
        esMulti
          ? `${listaPresupuestos.length} presupuestos`
          : `#${listaPresupuestos[0]?.n_presupuesto || ""}`
      }`}
      width="max-w-7xl"
      height="h-[92vh]"
    >
      {loadingReporte ? (
        <div className="flex justify-center items-center h-full">
          <BounceLoader color="#0b2c4d" size={70} />
        </div>
      ) : reportesDetalle.length > 0 && cliente ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full overflow-y-auto pr-1">
          {/* ── Columna principal ── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Modo de facturación */}
            <div className="bg-white border rounded-lg p-4">
              <h3 className="text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                Modo de facturación
              </h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setModoDescripcionCompleta(false)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold border transition ${
                    !modoDescripcionCompleta
                      ? "bg-[#0B2C4D] text-white border-[#0B2C4D]"
                      : "bg-white text-gray-700 border-gray-300 hover:border-[#0B2C4D]"
                  }`}
                >
                  Facturar por APUs
                </button>
                <button
                  type="button"
                  onClick={() => setModoDescripcionCompleta(true)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold border transition ${
                    modoDescripcionCompleta
                      ? "bg-[#0B2C4D] text-white border-[#0B2C4D]"
                      : "bg-white text-gray-700 border-gray-300 hover:border-[#0B2C4D]"
                  }`}
                >
                  Facturar por descripción completa
                </button>
              </div>
              {modoDescripcionCompleta && (
                <p className="text-xs text-gray-500 mt-2">
                  Se factura el {esMulti ? "monto total de los presupuestos" : "monto total del presupuesto"}{" "}
                  con IVA 16%. {esMulti
                    ? "Se genera un ítem por presupuesto, cada uno con su descripción y su monto."
                    : "No se aplica descuento adicional (el total ya lo incluye)."}
                </p>
              )}
            </div>

            {/* Datos del cliente */}
            <div className="bg-white border rounded-lg p-4">
              <h3 className="text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                Datos del cliente
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Nombre:</span>{" "}
                  <span className="font-medium">{cliente.nombre}</span>
                </div>
                <div>
                  <span className="text-gray-500">RIF:</span>{" "}
                  <span className="font-medium">{cliente.rif}</span>
                </div>
                <div>
                  <span className="text-gray-500">Encargado:</span>{" "}
                  <span className="font-medium">{cliente.encargado}</span>
                </div>
                <div>
                  <span className="text-gray-500">Teléfono:</span>{" "}
                  <span className="font-medium">{cliente.telefono}</span>
                </div>
                <div>
                  <span className="text-gray-500">Dirección:</span>{" "}
                  <span className="font-medium">{cliente.direccion}</span>
                </div>
              </div>
            </div>

            {/* Fecha + moneda + tasa */}
            <div className="bg-white border rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Fecha de factura (DD/MM/AAAA) *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={fecha}
                  onChange={(e) => setFecha(enmascararFecha(e.target.value))}
                  placeholder="DD/MM/AAAA"
                  maxLength={10}
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                    fecha && !esFechaValida(fecha)
                      ? "border-red-400 focus:ring-red-300"
                      : "border-gray-300 focus:ring-[#0B2C4D]/30"
                  }`}
                />
                {fecha && !esFechaValida(fecha) && (
                  <p className="text-xs text-red-500 mt-1">
                    Formato inválido. Usá DD/MM/AAAA.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Moneda
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleChangeMoneda("USD")}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold border transition ${
                      moneda === "USD"
                        ? "bg-[#0B2C4D] text-white border-[#0B2C4D]"
                        : "bg-white text-gray-700 border-gray-300 hover:border-[#0B2C4D]"
                    }`}
                  >
                    USD ($)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChangeMoneda("BS")}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold border transition ${
                      moneda === "BS"
                        ? "bg-[#0B2C4D] text-white border-[#0B2C4D]"
                        : "bg-white text-gray-700 border-gray-300 hover:border-[#0B2C4D]"
                    }`}
                  >
                    Bs
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Tasa BCV (oficial)
                </label>
                {tasaBCV ? (
                  <div className="border border-blue-200 bg-blue-50 rounded-lg px-3 py-2 text-sm">
                    <p className="font-bold text-blue-800">
                      <FaDollarSign className="inline mr-1" size={14} />
                      Bs{" "}
                      {Number(tasaBCV.promedio).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 4,
                      })}
                    </p>
                    <p className="text-xs text-blue-600">
                      Actualización: {formatFecha(tasaBCV.fechaActualizacion)}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-red-500 border border-red-200 bg-red-50 rounded-lg px-3 py-2">
                    Tasa no disponible
                  </p>
                )}
              </div>
            </div>

            {/* Editor de items */}
            <div className="bg-white border rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                  {modoDescripcionCompleta
                    ? "Facturación por descripción completa"
                    : "Items a facturar"}
                </h3>
                {!modoDescripcionCompleta && (
                  <button
                    onClick={handleAgregarManual}
                    className="text-sm text-red-600 hover:text-red-800 font-semibold flex items-center gap-1"
                  >
                    <FaPlus size={12} />
                    Agregar línea manual
                  </button>
                )}
              </div>

              {modoDescripcionCompleta ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Descripción completa
                    </label>
                    <textarea
                      rows={3}
                      value={descCompleta}
                      onChange={(e) => setDescCompleta(e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm resize-y"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Unidad
                      </label>
                      <input
                        type="text"
                        value={unidadCompleta}
                        onChange={(e) => setUnidadCompleta(e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Cantidad
                      </label>
                      <input
                        type="number"
                        value={1}
                        disabled
                        className="w-full border border-gray-200 bg-gray-100 rounded px-3 py-2 text-sm text-center disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        P. Unit ({moneda}) —{" "}
                        {esMulti ? "total de los presupuestos" : "total del presupuesto"}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={precioCompleta}
                        onChange={(e) => setPrecioCompleta(e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-right"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[680px]">
                    <thead className="bg-gray-50 border-b">
                      <tr className="text-xs text-gray-600 font-bold">
                        <th className="px-2 py-2 text-left">Descripción</th>
                        <th className="px-2 py-2 text-center w-20">Und.</th>
                        <th className="px-2 py-2 text-center w-24">Pendiente</th>
                        <th className="px-2 py-2 text-center w-24">Cantidad</th>
                        <th className="px-2 py-2 text-right w-32">P.Unit ({moneda})</th>
                        <th className="px-2 py-2 text-right w-32">Total</th>
                        <th className="px-2 py-2 text-center w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => {
                        const esManual = !item.apu_id;
                        const itemTotal =
                          (Number(item.cantidad) || 0) * (Number(item.precio_unitario) || 0);
                        return (
                          <tr key={index} className="border-t align-top">
                            <td className="px-2 py-2">
                              {esManual ? (
                                <textarea
                                  rows={2}
                                  value={item.apu_descripcion}
                                  onChange={(e) =>
                                    handleItemChange(index, "apu_descripcion", e.target.value)
                                  }
                                  className="w-full border border-dashed border-orange-300 bg-orange-50/40 rounded px-2 py-1 text-sm resize-y"
                                />
                              ) : (
                                <input
                                  type="text"
                                  value={item.apu_descripcion}
                                  onChange={(e) =>
                                    handleItemChange(index, "apu_descripcion", e.target.value)
                                  }
                                  className={`w-full border rounded px-2 py-1 text-sm ${
                                    esManual
                                      ? "border-dashed border-orange-300 bg-orange-50/40"
                                      : "border-gray-300"
                                  }`}
                                />
                              )}
                              {esManual && (
                                <p className="text-[10px] text-orange-500 mt-0.5">
                                  Línea manual
                                </p>
                              )}
                            </td>
                            <td className="px-2 py-2">
                              <input
                                type="text"
                                value={item.unidad}
                                onChange={(e) =>
                                  handleItemChange(index, "unidad", e.target.value)
                                }
                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-center"
                              />
                            </td>
                            <td className="px-2 py-2 text-center text-orange-600 font-medium">
                              {esManual ? "—" : item.cantidad_pendiente}
                            </td>
                            <td className="px-2 py-2">
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  max={esManual ? undefined : item.cantidad_pendiente}
                                  value={item.cantidad}
                                  onChange={(e) =>
                                    handleItemChange(index, "cantidad", e.target.value)
                                  }
                                  disabled={!esManual && item.cantidad_pendiente <= 0}
                                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-center disabled:bg-gray-100"
                                />
                                {!esManual && (
                                  <button
                                    onClick={() => handleItemCompleto(index)}
                                    title="Facturar completo"
                                    className="text-green-600 hover:text-green-800"
                                  >
                                    <FaCheckDouble size={14} />
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="px-2 py-2">
                              <input
                                type="number"
                                step="0.01"
                                value={item.precio_unitario}
                                onChange={(e) =>
                                  handleItemChange(index, "precio_unitario", e.target.value)
                                }
                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-right"
                              />
                            </td>
                            <td className="px-2 py-2 text-right font-medium text-gray-800">
                              {formatMoneda(itemTotal, moneda)}
                            </td>
                            <td className="px-2 py-2 text-center">
                              <button
                                onClick={() => handleRemoveItem(index)}
                                className="text-red-500 hover:text-red-700"
                                title="Quitar"
                              >
                                <FaTrash size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Descuento + IVA + totales */}
            <div className="bg-white border rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Descuento (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    step="0.01"
                    value={porcentajeDescuento}
                    onChange={(e) => setPorcentajeDescuento(e.target.value)}
                    disabled={modoDescripcionCompleta}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-gray-100"
                  />
                  {modoDescripcionCompleta && (
                    <p className="text-xs text-gray-500 mt-1">
                      Descuento deshabilitado: el total del presupuesto ya lo incluye.
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    IVA (16%)
                  </label>
                  <p className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-700">
                    {formatMoneda(totales.iva, moneda)}
                  </p>
                </div>
              </div>

              <div className="flex justify-end border-t pt-4">
                <div className="w-full max-w-xs space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">
                      {formatMoneda(totales.subtotal, moneda)}
                    </span>
                  </div>
                  {totales.montoDescuento > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Descuento ({porcentajeDescuento}%)</span>
                      <span>- {formatMoneda(totales.montoDescuento, moneda)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">IVA</span>
                    <span className="font-medium">
                      {formatMoneda(totales.iva, moneda)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold">
                    <span>TOTAL</span>
                    <span className="text-[#0B2C4D]">
                      {formatMoneda(totales.total, moneda)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Columna lateral / Resumen ── */}
          <div className="lg:col-span-1">
            <div className="bg-[#0B2C4D] text-white rounded-lg p-5 sticky top-0">
              <div className="flex items-center gap-3 mb-3">
                <FaFileInvoiceDollar size={24} />
                <h3 className="font-bold text-lg">Resumen</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/70">Factura</span>
                  <span className="font-semibold">
                    {numeroFactura || configFactura?.siguiente_n_factura || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Presupuesto</span>
                  <span className="font-semibold">
                    {esMulti
                      ? `${listaPresupuestos.length} presupuestos`
                      : `#${reportesDetalle[0]?.n_presupuesto || "—"}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Cliente</span>
                  <span className="font-semibold truncate max-w-[150px]">
                    {cliente?.nombre || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Fecha</span>
                  <span className="font-semibold">{fecha || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Moneda</span>
                  <span className="font-semibold">{moneda === "BS" ? "Bs" : "USD"}</span>
                </div>
                <div className="border-t border-white/30 pt-3 flex justify-between items-center">
                  <span className="text-white/70">Total a facturar</span>
                  <span className="font-bold text-lg">
                    {reportesDetalle.length > 0
                      ? formatMoneda(totales.total, moneda)
                      : "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Monto ya facturado</span>
                  <span className="font-semibold">
                    {formatMoneda(montoFacturadoEnMoneda, moneda)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Restante por facturar</span>
                  <span className="font-semibold">
                    {formatMoneda(restanteEnMoneda, moneda)}
                  </span>
                </div>
                {subtotalExcedeRestante && (
                  <div className="bg-red-500/20 border border-red-400/60 rounded-md px-3 py-2 text-xs text-red-100">
                    El subtotal supera el restante por facturar del presupuesto.
                  </div>
                )}
              </div>

              {/* Datos de la factura (orden de control + orden de servicio) */}
              <div className="mt-4 space-y-3 border-t border-white/20 pt-4">
                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1">
                    Orden de control
                  </label>
                  <input
                    type="text"
                    value={ordenControl}
                    onChange={(e) => setOrdenControl(e.target.value)}
                    className="w-full bg-white/10 text-white border border-white/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1">
                    Orden de servicio
                  </label>
                  <input
                    type="text"
                    value={ordenServicio}
                    onChange={(e) => setOrdenServicio(e.target.value)}
                    className="w-full bg-white/10 text-white border border-white/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/40"
                  />
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={guardando}
                className="mt-5 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                <FaSave size={18} />
                {guardando ? "Guardando..." : "Guardar factura"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-10 text-gray-500">
          No se pudo cargar el presupuesto.
        </div>
      )}
    </Modal>
  );
}