import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatFecha } from "../utils";

/* =========================
       CONSTANTES DE HOJA
    ========================= */
const PAGE_W = 215.9;
const PAGE_H = 279.4;
const TOP_MARGIN = 60;
const BOTTOM_MARGIN = 30;
const CONTENT_BOTTOM = PAGE_H - BOTTOM_MARGIN;
const LEFT = 15;
const CONTENT_W = PAGE_W - LEFT * 2;

const CFG_FIJO = { tabla: 8.5, cabeza: 8.5, padding: 1.2 };

const COL_CANT = 18;
const COL_DESC = 108;
const COL_PRECIO = 31;
const COL_MONTO = 32.9;
const LINE_MM = CFG_FIJO.tabla * 1.15 * 0.3528;
const HEAD_H = LINE_MM + CFG_FIJO.padding * 2;
const FOOTER_Y = CONTENT_BOTTOM - 30;
const MAX_TABLA_BOTTOM = FOOTER_Y - 6;

/* =========================
        HELPERS
    ========================= */
const sanitizarParte = (parte) =>
  String(parte || "")
    .replace(/[\\/:*?"<>|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const formatCantidad = (cantidad) => {
  const n = Number(cantidad || 0);
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
};

const formatTasa4 = (tasa) =>
  Number(tasa || 0).toLocaleString("en-US", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });

const formatFechaHora = (value) => {
  if (!value) return { fecha: "—", hora: "—" };
  const date = new Date(value);
  if (isNaN(date.getTime())) return { fecha: value, hora: "" };
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  let h = date.getHours();
  const min = String(date.getMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return {
    fecha: `${d}/${m}/${date.getFullYear()}`,
    hora: `${String(h).padStart(2, "0")}:${min} (${ampm})`,
  };
};

const resolverTasa = (nota, extra) => {
  const deNota = Number(nota.tasa_bs_usd);
  if (deNota > 0) {
    return { valor: deNota, fecha: nota.fecha_tasa || null };
  }
  const bcv = Number(extra?.tasaBCV?.promedio);
  if (bcv > 0) {
    return { valor: bcv, fecha: extra?.tasaBCV?.fechaActualizacion || null };
  }
  return { valor: null, fecha: null };
};

const generarNombreArchivo = (nota, extra) => {
  const partes = [
    sanitizarParte(nota.n_nota),
    sanitizarParte(extra?.n_factura || ""),
  ].filter(Boolean);

  if (!partes.length) {
    partes.push(sanitizarParte(nota.n_nota) || "nota-credito");
  }
  return `${partes.join(" ")}.pdf`;
};

/* =========================
     CÁLCULO DE ESPACIO
    ========================= */
const calcularMaxItems = (items = [], direccion = "") => {
  const doc = new jsPDF({
    orientation: "p",
    unit: "mm",
    format: [PAGE_W, PAGE_H],
  });

  const lineasDireccion = doc.splitTextToSize(`${direccion || ""}`, CONTENT_W - 24);
  const N = Math.max(lineasDireccion.length, 1);
  const startY = TOP_MARGIN + 18 + (14 + N * 5 + 6) + 8;

  const espacioDisponible = MAX_TABLA_BOTTOM - startY;
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
const construirDoc = (nota, extra, cfg) => {
  const doc = new jsPDF({
    orientation: "p",
    unit: "mm",
    format: [PAGE_W, PAGE_H],
  });
  const moneda = nota.moneda || "USD";

  const fmtCelda = (v) => {
    const n = Number(v || 0);
    const f = n.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return moneda === "BS" ? `Bs ${f}` : `$${f}`;
  };

  /* ---- ENCABEZADO ---- */
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("NOTA DE CRÉDITO", LEFT, TOP_MARGIN);
  doc.setFontSize(11);
  doc.text(`N° ${nota.n_nota || "—"}`, PAGE_W - LEFT, TOP_MARGIN, {
    align: "right",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const { fecha: fechaNota, hora: horaNota } = formatFechaHora(
    nota.created_at || new Date()
  );
  const fechaHeader = nota.fecha
    ? String(nota.fecha).split("T")[0].split("-").reverse().join("/")
    : fechaNota;
  doc.text(
    `FECHA: ${fechaHeader}    HORA: ${horaNota}`,
    LEFT,
    TOP_MARGIN + 6,
  );

  /* ---- FACTURA REFERENCIA ---- */
  doc.setFont("helvetica", "bold");
  doc.text("FACTURA REFERENCIA:", LEFT, TOP_MARGIN + 10);
  doc.setFont("helvetica", "normal");
  doc.text(nota.n_factura || "—", LEFT + 38, TOP_MARGIN + 10);

  /* ---- MOTIVO ---- */
  doc.setFont("helvetica", "bold");
  doc.text("MOTIVO:", PAGE_W - LEFT, TOP_MARGIN + 10, { align: "right" });
  doc.setFont("helvetica", "normal");
  const motivoCorto = (nota.motivo || "—").slice(0, 80);
  doc.text(motivoCorto, PAGE_W - LEFT, TOP_MARGIN + 14, { align: "right" });

  /* ---- DATOS DEL CLIENTE ---- */
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("DATOS DEL CLIENTE", LEFT, TOP_MARGIN + 20);

  const nombre = nota.cliente_nombre || "—";
  const rif = nota.cliente_rif || "—";
  const telefono = nota.cliente_telefono || "—";
  const direccion = nota.cliente_direccion || "—";

  const lineasDireccion = doc.splitTextToSize(`${direccion}`, CONTENT_W - 24);
  const yCliente = TOP_MARGIN + 22;

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

  /* ---- TABLA DE ITEMS ---- */
  let startY = yCliente + 14 + lineasDireccion.length * 5 + 6;

  const rows = (nota.items && nota.items.length ? nota.items : [{}]).map((item) => [
    formatCantidad(item.cantidad),
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

  /* ---- TOTALES ---- */
  const subtotal = Number(nota.subtotal || 0);
  const montoDescuento = Number(nota.monto_descuento || 0);
  const baseImponible = subtotal - montoDescuento;
  const iva = Number(nota.monto_iva || 0);
  const total = Number(nota.total || 0);
  const porcentajeIva = Number(nota.porcentaje_iva || 16);
  const esUSD = moneda === "USD";
  const tasa = esUSD
    ? Number(nota.tasa_bs_usd || extra?.tasaBCV?.promedio || 0)
    : 0;

  const baseImponibleBS = esUSD ? baseImponible * tasa : baseImponible;
  const ivaBS = esUSD ? iva * tasa : iva;
  const totalBS = esUSD ? total * tasa : total;

  const fmtNum = (n) =>
    Number(n || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const footerY = CONTENT_BOTTOM - 30;
  const totalsStartY = Math.max(footerY, doc.lastAutoTable.finalY + 6);

  const bsShift = 8;
  const rightAreaX = PAGE_W - LEFT;
  const rightAreaW = 120;
  const rightAreaStart = rightAreaX - rightAreaW;

  const colW = esUSD ? rightAreaW / 2 : rightAreaW;
  const bsLabelX = esUSD
    ? rightAreaStart + 1 - bsShift
    : rightAreaStart + 58 - bsShift;
  const bsValX = rightAreaStart + colW - 2 - bsShift;
  const usdLabelX = esUSD ? rightAreaStart + colW + 1 : null;
  const usdValX = rightAreaX - 2;

  const rowH = 7;
  const labelFS = 7.5;
  const valFS = 8;
  const totalLabelFS = 9.5;
  const totalFS = 10.5;

  const bsPrefijo = "Bs ";

  const drawRow = (y, label, valBS, valUSD, isTotal = false) => {
    const fs = isTotal ? totalLabelFS : labelFS;
    const vfs = isTotal ? totalFS : valFS;
    const lw = isTotal ? "bold" : "normal";
    const vw = isTotal ? "bold" : "normal";

    doc.setFont("helvetica", lw);
    doc.setFontSize(fs);
    doc.text(label, bsLabelX, y);
    doc.setFont("helvetica", vw);
    doc.setFontSize(vfs);
    doc.text(`${bsPrefijo}${fmtNum(valBS)}`, bsValX, y, { align: "right" });

    if (esUSD) {
      doc.setFont("helvetica", lw);
      doc.setFontSize(fs);
      doc.text(label, usdLabelX, y);
      doc.setFont("helvetica", vw);
      doc.setFontSize(vfs);
      doc.text(`$${fmtNum(valUSD)}`, usdValX, y, { align: "right" });
    }
  };

  drawRow(
    totalsStartY + rowH * 0,
    `Total Base Imponible ${porcentajeIva} %`,
    baseImponibleBS,
    baseImponible,
  );
  drawRow(totalsStartY + rowH * 1, "Total Exento", 0, 0);
  drawRow(totalsStartY + rowH * 2, `Total IVA ${porcentajeIva} %`, ivaBS, iva);

  const totalY = totalsStartY + rowH * 3;
  const totalLabel = "Total Nota de Crédito";

  doc.setFont("helvetica", "bold");
  doc.setFontSize(totalLabelFS);
  doc.text(totalLabel, bsLabelX, totalY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(totalFS);
  doc.text(`${bsPrefijo}${fmtNum(totalBS)}`, bsValX, totalY, { align: "right" });

  if (esUSD) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(totalLabelFS);
    doc.text(totalLabel, usdLabelX, totalY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(totalFS);
    doc.text(`$${fmtNum(total)}`, usdValX, totalY, { align: "right" });
  }

  let lastY = totalY + 7;

  // Texto legal (solo USD)
  if (esUSD) {
    const { valor, fecha } = resolverTasa(nota, extra);
    const tasaStr = valor != null ? `Bs ${formatTasa4(valor)}` : "—";
    const fechaStr = fecha ? ` (fecha de la tasa: ${formatFecha(fecha)})` : "";

    const parrafoLegal =
      `Esta nota de crédito se emite en referencia a la factura ${nota.n_factura || "—"} ` +
      "en cumplimiento del deber formal establecido en los ART. 25 de la LIVA, ART. 38 del RGLIVA y ART. 13 #14 de la PALIVA 0071 " +
      `donde establece la conversión según el tipo de cambio BCV vigente a la fecha. TASA BCV: ${tasaStr}${fechaStr}.`;

    const lineasLegal = doc.splitTextToSize(parrafoLegal, CONTENT_W - 2);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7);
    doc.text(lineasLegal, LEFT, lastY + 4);
    lastY += 5 + lineasLegal.length * 3.5;
  }

  const overflow = doc.getNumberOfPages() > 1;
  return { doc, overflow };
};

/* =========================
      GENERADOR PRINCIPAL
    ========================= */
export default function usePDFNotaCredito() {
  const generarPDFNotaCredito = (nota, extra = {}) => {
    const resultado = construirDoc(nota, extra, CFG_FIJO);

    if (resultado.overflow) {
      return { ok: false, motivo: "LIMITE" };
    }

    resultado.doc.save(generarNombreArchivo(nota, extra));
    return { ok: true, doc: resultado.doc };
  };

  return { generarPDFNotaCredito, calcularMaxItems };
}
