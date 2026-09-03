import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatFecha } from "../utils";

/* =========================
       CONSTANTES DE HOJA
    ========================= */
const PAGE_W = 215.9; // Carta (Letter) ancho mm
const PAGE_H = 279.4; // Carta (Letter) alto mm
const TOP_MARGIN = 60; // 6 cm superior (membrete preimpreso)
const BOTTOM_MARGIN = 30; // 3 cm inferior
const CONTENT_BOTTOM = PAGE_H - BOTTOM_MARGIN; // 249.4
const LEFT = 15;
const CONTENT_W = PAGE_W - LEFT * 2;

// ── FUENTE FIJA de la tabla de ítems (no cambia nunca) ──
const CFG_FIJO = { tabla: 8.5, cabeza: 8.5, padding: 1.2 };

// ── Geometría de la tabla de ítems ──
const COL_CANT = 18; // ancho col 0 (CANTIDAD)
const COL_DESC = 108; // ancho col 1 (DESCRIPCIÓN)
const COL_PRECIO = 31; // ancho col 2 (PRECIO UNITARIO)
const COL_MONTO = 32.9; // ancho col 3 (MONTO)
// Línea de texto (mm) para la fuente fija: fuente * lineHeight(1.15) * pt→mm
const LINE_MM = CFG_FIJO.tabla * 1.15 * 0.3528; // ≈ 3.45mm
// Alto de la fila de encabezado (título de descripción en 1 línea)
const HEAD_H = LINE_MM + CFG_FIJO.padding * 2; // ≈ 5.85mm
// Ancla vertical de los totales (footer): si la tabla pasa aquí, va a 2 hojas
const FOOTER_Y = CONTENT_BOTTOM - 30; // ≈ 219.4mm
// La tabla debe terminar ANTES de los totales (margen de 6mm)
const MAX_TABLA_BOTTOM = FOOTER_Y - 6; // ≈ 213.4mm

/* =========================
        HELPERS
    ========================= */
/** Quita caracteres inválidos para nombre de archivo y colapsa espacios */
const sanitizarParte = (parte) =>
  String(parte || "")
    .replace(/[\\/:*?"<>|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Cantidad: entera sin decimales, fraccionaria con 2 decimales */
const formatCantidad = (cantidad) => {
  const n = Number(cantidad || 0);
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
};

/** Tasa con 4 decimales */
const formatTasa4 = (tasa) =>
  Number(tasa || 0).toLocaleString("en-US", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });

/** Fecha y hora separadas en formato 12 horas para el encabezado */
const formatFechaHora = (value) => {
  if (!value) return { fecha: "—", hora: "—" };
  const date = new Date(value);
  if (isNaN(date.getTime())) return { fecha: value, hora: "" };
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  let h = date.getHours();
  const min = String(date.getMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12; // 0 → 12 (medianoche), 12 → 12 (mediodía)
  return {
    fecha: `${d}/${m}/${date.getFullYear()}`,
    hora: `${String(h).padStart(2, "0")}:${min} (${ampm})`,
  };
};

/** Resuelve la tasa a imprimir en USD: factura → estado tasaBCV → null */
const resolverTasa = (factura, extra) => {
  const deFactura = Number(factura.tasa_bs_usd);
  if (deFactura > 0) {
    return { valor: deFactura, fecha: factura.fecha_tasa || null };
  }
  const bcv = Number(extra?.tasaBCV?.promedio);
  if (bcv > 0) {
    return { valor: bcv, fecha: extra?.tasaBCV?.fechaActualizacion || null };
  }
  return { valor: null, fecha: null };
};

/** Nombre de archivo: {orden_control} {n_factura} {descripcion}.pdf */
const generarNombreArchivo = (factura, extra) => {
  const partes = [
    sanitizarParte(factura.orden_control),
    sanitizarParte(factura.n_factura),
    sanitizarParte(extra?.descripcion || "").slice(0, 80),
  ].filter(Boolean);

  if (!partes.length) {
    partes.push(sanitizarParte(factura.n_factura) || "factura");
  }
  return `${partes.join(" ")}.pdf`;
};

/* =========================
     CÁLCULO DE ESPACIO (fuente fija, 1 hoja)
    ========================= */
/**
 * Calcula cuántos ítems caben en el espacio físico de la hoja con la fuente fija,
 * sin pasar de la página. Mide el wrapping real de cada descripción.
 *
 * @param {Array<{apu_descripcion?: string}>} items
 * @param {string} direccion Dirección del cliente (afecta el tope de la tabla)
 * @returns {{ maxItems: number, espacioUsado: number, espacioDisponible: number, cabenTodos: boolean }}
 */
const calcularMaxItems = (items = [], direccion = "") => {
  // Doc temporal solo para medir texto
  const doc = new jsPDF({
    orientation: "p",
    unit: "mm",
    format: [PAGE_W, PAGE_H],
  });

  // Tope de la tabla (igual que en construirDoc)
  const lineasDireccion = doc.splitTextToSize(`${direccion || ""}`, CONTENT_W - 24);
  const N = Math.max(lineasDireccion.length, 1);
  const startY = TOP_MARGIN + 18 + (14 + N * 5 + 6) + 8; // 106 + 5·N

  const espacioDisponible = MAX_TABLA_BOTTOM - startY;

  // Encabezado de la tabla
  let usado = HEAD_H;
  let maxItems = 0;

  for (const item of items) {
    const desc = String(item?.apu_descripcion || "—");
    const lineas = doc.splitTextToSize(desc, COL_DESC).length;
    const altoFila = lineas * LINE_MM + CFG_FIJO.padding * 2;
    if (usado + altoFila > espacioDisponible) break;
    usado += altoFila;
    maxItems += 1;
  }

  return {
    maxItems,
    espacioUsado: usado,
    espacioDisponible,
    cabenTodos: maxItems === items.length,
  };
};

/* =========================
     CONSTRUCCIÓN DEL DOC
    ========================= */
const construirDoc = (factura, extra, cfg) => {
  const doc = new jsPDF({
    orientation: "p",
    unit: "mm",
    format: [PAGE_W, PAGE_H],
  });
  const moneda = factura.moneda || "USD";
  const esCompleta = Boolean(factura.factura_completa);

  // Formatea una cifra para las columnas de la tabla: en BS solo el número
  // (sin "Bs"), en USD con "$". (formatMoneda agrega "Bs" en BS, no queremos aquí)
  const fmtCelda = (v) => {
    const n = Number(v || 0);
    const f = n.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return moneda === "BS" ? `Bs ${f}` : `$${f}`;
  };

  /* ---- ENCABEZADO (inicia en TOP_MARGIN) ---- */
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("FACTURA", LEFT, TOP_MARGIN);
  doc.setFontSize(11);
  doc.text(`N° ${factura.n_factura || "—"}`, PAGE_W - LEFT, TOP_MARGIN, {
    align: "right",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  // FECHA/HORA del DÍA de la factura (no la actual). La fecha viene como
  // "YYYY-MM-DD" (string puro): se formatea directo para evitar el corrimiento
  // de zona horaria de `new Date("YYYY-MM-DD")` (UTC-4 → día anterior).
  // La hora sale de factura.created_at (momento de emisión), con fallback a la
  // hora actual si la factura no tiene timestamp.
  const { fecha: fechaFactura, hora: horaFactura } = formatFechaHora(
    factura.created_at || new Date()
  );
  const fechaHeader = factura.fecha
    ? String(factura.fecha).split("T")[0].split("-").reverse().join("/")
    : fechaFactura;
  doc.text(
    `FECHA: ${fechaHeader}    HORA: ${horaFactura}`,
    LEFT,
    TOP_MARGIN + 6,
  );
  doc.text(
    `ORDEN DE SERVICIO: ${factura.orden_servicio || "—"}`,
    PAGE_W - LEFT,
    TOP_MARGIN + 6,
    { align: "right" },
  );

  /* ---- PRESUPUESTO(S) vinculado(s) a la factura ---- */
  const listaPresupuestosPDF =
    Array.isArray(factura.n_presupuestos) && factura.n_presupuestos.length
      ? factura.n_presupuestos
      : [factura.n_presupuesto].filter(Boolean);
  doc.setFont("helvetica", "bold");
  doc.text(
    "PRESUPUESTO(S):",
    LEFT,
    TOP_MARGIN + 10,
  );
  doc.setFont("helvetica", "normal");
  doc.text(
    listaPresupuestosPDF.map((np) => `#${np}`).join("  |  "),
    LEFT + 34,
    TOP_MARGIN + 10,
  );

  /* ---- DATOS DEL CLIENTE (sin encargado) ---- */
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("DATOS DEL CLIENTE", LEFT, TOP_MARGIN + 16);

  const nombre = factura.cliente_nombre || "—";
  const rif = factura.cliente_rif || "—";
  const telefono = factura.cliente_telefono || "—";
  const direccion = factura.cliente_direccion || "—";

  const lineasDireccion = doc.splitTextToSize(`${direccion}`, CONTENT_W - 24);
  const altCliente = 14 + lineasDireccion.length * 5 + 6; // +6 para la fila de condición de pago
  const yCliente = TOP_MARGIN + 18;

  doc.setFont("helvetica", "bold");
  doc.text("NOMBRE O RAZÓN SOCIAL:", LEFT + 2, yCliente + 5);
  doc.setFont("helvetica", "normal");
  doc.text(String(nombre), LEFT + 45, yCliente + 5);

  doc.setFont("helvetica", "bold");
  doc.text("RIF:", LEFT + 2, yCliente + 10);
  doc.setFont("helvetica", "normal");
  doc.text(String(rif), LEFT + 15, yCliente + 10);

  doc.setFont("helvetica", "bold");
  doc.text("TELÉFONO:", LEFT + 70, yCliente + 10);
  doc.setFont("helvetica", "normal");
  doc.text(String(telefono), LEFT + 91, yCliente + 10);

  doc.setFont("helvetica", "bold");
  doc.text("DIRECCIÓN:", LEFT + 2, yCliente + 15);
  doc.setFont("helvetica", "normal");
  doc.text(lineasDireccion, LEFT + 22, yCliente + 15);

  /* ---- CONDICIÓN DE PAGO ---- */
  doc.setFont("helvetica", "bold");
  doc.text(
    "CONDICIÓN DE PAGO:",
    LEFT + 2,
    yCliente + 15 + lineasDireccion.length * 5 + 5,
  );
  doc.setFont("helvetica", "normal");
  doc.text(
    "CRÉDITO",
    LEFT + 36,
    yCliente + 15 + lineasDireccion.length * 5 + 5,
  );

  /* ---- TABLA DE ITEMS ---- */
  let startY = yCliente + altCliente + 8;

  const rows = (
    factura.items && factura.items.length ? factura.items : [{}]
  ).map((item) => [
    esCompleta ? "1" : formatCantidad(item.cantidad),
    item.apu_descripcion || "—",
    fmtCelda(item.precio_unitario),
    fmtCelda(item.total_item),
  ]);

  autoTable(doc, {
    startY,
    margin: { top: TOP_MARGIN, bottom: BOTTOM_MARGIN, left: LEFT, right: LEFT },
    head: [
      [
        "CANTIDAD",
        "DESCRIPCIÓN DE LA VENTA O PRESTACIÓN DEL SERVICIO",
        "PRECIO UNITARIO",
        "MONTO DEL BIEN O SERVICIO",
      ],
    ],
    body: rows,
    theme: "plain",
    overflow: "linebreak",
    styles: {
      fontSize: cfg.tabla,
      cellPadding: cfg.padding,
      halign: "left",
      valign: "middle",
      lineWidth: 0,
    },
    headStyles: {
      fillColor: [230, 230, 230],
      textColor: 0,
      fontStyle: "bold",
      fontSize: cfg.cabeza,
      halign: "center",
      lineWidth: 0,
    },
    columnStyles: {
      0: { halign: "center", valign: "top", cellWidth: COL_CANT },
      1: { halign: "left", valign: "middle", cellWidth: COL_DESC },
      2: { halign: "right", valign: "bottom", cellWidth: COL_PRECIO },
      3: { halign: "right", valign: "bottom", cellWidth: COL_MONTO },
    },
  });

  /* ---- TOTALES (footer compacto, alineado a la derecha con la tabla) ---- */
  const subtotal = Number(factura.subtotal || 0);
  const montoDescuento = Number(factura.monto_descuento || 0);
  const baseImponible = subtotal - montoDescuento;
  const iva = Number(factura.monto_iva || 0);
  const total = Number(factura.total || 0);
  const porcentajeIva = Number(factura.porcentaje_iva || 16);
  const esUSD = moneda === "USD";
  const tasa = esUSD
    ? Number(factura.tasa_bs_usd || extra?.tasaBCV?.promedio || 0)
    : 0;

  // Debug: si es USD y tasa es 0, avisar (el caller debe pasar la tasa)
  if (esUSD && tasa === 0) {
    console.warn(
      "[usePDFFactura] Factura en USD sin tasa de cambio. Se usará 0. Pasar factura.tasa_bs_usd o extra.tasaBCV.promedio",
    );
  }

  // Valores en BS (siempre se calculan: si es USD usa tasa, si es BS son los mismos)
  const baseImponibleBS = esUSD ? baseImponible * tasa : baseImponible;
  const ivaBS = esUSD ? iva * tasa : iva;
  const totalBS = esUSD ? total * tasa : total;
  const exentoBS = 0;
  const exentoUSD = 0;

  // Helper para formatear solo número
  const fmtNum = (n) =>
    Number(n || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  // Posición del footer: al final de la página o después de la tabla
  const footerY = CONTENT_BOTTOM - 30; // más compacto: 30mm desde fondo
  const totalsStartY = Math.max(footerY, doc.lastAutoTable.finalY + 6);

  // Corrimiento de la columna BS hacia la izquierda (~15px ≈ 4mm)
  const bsShift = 8;
  // Área derecha para los totales
  const rightAreaX = PAGE_W - LEFT; // borde derecho = 200.9mm
  const rightAreaW = 120; // ancho total de la zona de totales
  const rightAreaStart = rightAreaX - rightAreaW; // ~80.9mm

  // Estructura de dos columnas (BS | $ en USD; una sola columna en BS).
  // Cada columna lleva su etiqueta a la izquierda y su valor a la derecha.
  const colW = esUSD ? rightAreaW / 2 : rightAreaW; // ~60mm c/u en USD, ~120mm en BS
  // Etiqueta BS: en USD va al inicio de su columna; en BS se corre a la derecha,
  // cerca de las cifras (que van al borde derecho).
  const bsLabelX = esUSD
    ? rightAreaStart + 1 - bsShift
    : rightAreaStart + 58 - bsShift;
  // Valor BS siempre a la derecha de su columna (al borde derecho en BS).
  const bsValX = rightAreaStart + colW - 2 - bsShift;
  const usdLabelX = esUSD ? rightAreaStart + colW + 1 : null; // etiqueta USD
  const usdValX = rightAreaX - 2; // valor USD siempre al borde derecho

  const rowH = 7; // más alto para fuentes mayores
  const labelFS = 7.5;
  const valFS = 8;
  const totalLabelFS = 9.5;
  const totalFS = 10.5;

  // Prefijo de la columna BS: siempre "Bs " (tanto en USD como en bolívares),
  // para que una factura en Bs quede claramente identificada como tal.
  const bsPrefijo = "Bs ";

  // Helper para dibujar fila compacta
  const drawRow = (y, label, valBS, valUSD, isTotal = false) => {
    const fs = isTotal ? totalLabelFS : labelFS;
    const vfs = isTotal ? totalFS : valFS;
    const lw = isTotal ? "bold" : "normal";
    const vw = isTotal ? "bold" : "normal";

    // Columna BS (siempre) - etiqueta + valor
    doc.setFont("helvetica", lw);
    doc.setFontSize(fs);
    doc.text(label, bsLabelX, y);
    doc.setFont("helvetica", vw);
    doc.setFontSize(vfs);
    doc.text(`${bsPrefijo}${fmtNum(valBS)}`, bsValX, y, { align: "right" });

    // Columna USD (solo si es USD) - etiqueta + valor
    if (esUSD) {
      doc.setFont("helvetica", lw);
      doc.setFontSize(fs);
      doc.text(label, usdLabelX, y);
      doc.setFont("helvetica", vw);
      doc.setFontSize(vfs);
      doc.text(`$${fmtNum(valUSD)}`, usdValX, y, { align: "right" });
    }
  };

  // Fila 1: Total Base Imponible
  drawRow(
    totalsStartY + rowH * 0,
    `Total Base Imponible ${porcentajeIva} %`,
    baseImponibleBS,
    baseImponible,
  );

  // Fila 2: Total Exento
  drawRow(totalsStartY + rowH * 1, "Total Exento", exentoBS, exentoUSD);

  // Fila 3: Total IVA
  drawRow(totalsStartY + rowH * 2, `Total IVA ${porcentajeIva} %`, ivaBS, iva);

  // Fila 4: Total a Pagar - más destacado
  const totalY = totalsStartY + rowH * 3;
  const totalLabel = "Total a Pagar";

  // BS
  doc.setFont("helvetica", "bold");
  doc.setFontSize(totalLabelFS);
  doc.text(totalLabel, bsLabelX, totalY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(totalFS);
  doc.text(`${bsPrefijo}${fmtNum(totalBS)}`, bsValX, totalY, { align: "right" });

  // USD
  if (esUSD) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(totalLabelFS);
    doc.text(totalLabel, usdLabelX, totalY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(totalFS);
    doc.text(`$${fmtNum(total)}`, usdValX, totalY, { align: "right" });
  }

  let lastY = totalY + 7;

  // ---- TEXTO LEGAL (solo USD) - abajo a la izquierda de las columnas ----
  if (esUSD) {
    const { valor, fecha } = resolverTasa(factura, extra);
    const tasaStr = valor != null ? `Bs ${formatTasa4(valor)}` : "—";
    const fechaStr = fecha ? ` (fecha de la tasa: ${formatFecha(fecha)})` : "";

    const parrafoLegal =
      "Esta factura se emite en cumplimiento del deber formal establecido en los ART. 25 de la LIVA, ART. 38 del RGLIVA y ART. 13 #14 de la PALIVA 0071 en materia de facturacion donde establece la conversión según el " +
      `tipo de cambio BCV vigente a la fecha de la factura. TASA BCV: ${tasaStr}${fechaStr}.`;

    const lineasLegal = doc.splitTextToSize(parrafoLegal, CONTENT_W - 2); // ancho completo de la página
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7);
    doc.text(lineasLegal, LEFT, lastY + 4);
    lastY += 5 + lineasLegal.length * 3.5;
  }

  // Overflow solo según si la tabla salta de página.
  // No incluye lastY (totales/legal) para que la fuente de la tabla sea
  // consistente entre BS y USD (en USD el legal suma altura y antes la achicaba).
  const overflow = doc.getNumberOfPages() > 1;
  return { doc, overflow };
};

/* =========================
      GENERADOR PRINCIPAL
    ========================= */
export default function usePDFFactura() {
  /**
   * Genera el PDF con FUENTE FIJA. Nunca cambia el tamaño de la fuente.
   * Si los ítems no caben en una sola hoja, NO guarda el PDF y devuelve
   * { ok: false, motivo: "LIMITE" } para que el caller avise.
   */
  const generarPDFFactura = (factura, extra = {}) => {
    const resultado = construirDoc(factura, extra, CFG_FIJO);

    if (resultado.overflow) {
      return { ok: false, motivo: "LIMITE" };
    }

    resultado.doc.save(generarNombreArchivo(factura, extra));
    return { ok: true, doc: resultado.doc };
  };

  return { generarPDFFactura, calcularMaxItems };
}
