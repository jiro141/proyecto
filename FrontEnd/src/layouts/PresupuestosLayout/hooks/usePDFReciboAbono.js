import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../../../assets/img/Logotipo.png";
import sello from "../../../assets/img/sello.png";

const formatMonto = (value) => {
  const num = Number(value) || 0;
  return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// fecha_abono llega como ISO ("2026-10-02T00:00:00Z"). Se usa solo la parte
// de la fecha: convertirla a hora local la correría al día anterior.
const formatFecha = (valor) => {
  const iso = typeof valor === "string" ? valor.slice(0, 10) : "";
  const [y, m, d] = iso.split("-");
  return y && m && d ? `${d}/${m}/${y}` : new Date().toLocaleDateString("es-VE");
};

export default function usePDFReciboAbono() {
  /**
   * Genera el recibo PDF de un abono recién registrado.
   * @param {Object} abono - respuesta de createAbono (AbonoSerializer)
   * @param {Object} cliente - { nombre, rif } del cliente del presupuesto
   */
  const generarReciboAbono = (abono, cliente = {}) => {
    const doc = new jsPDF("p", "mm", "a4");
    const rojoHermabe = [227, 6, 19];

    const total = Number(abono.monto_total_reporte) || 0;
    const monto = Number(abono.monto) || 0;
    const restante = Number(abono.monto_restante) || 0;
    const abonosAnteriores = Math.max(total - restante - monto, 0);
    const nRecibo = String(abono.id ?? "").padStart(6, "0");
    const nombreCliente = (cliente.nombre || "—").toUpperCase();

    /* =========================
           ENCABEZADO
        ========================= */
    doc.addImage(logo, "PNG", 10, 10, 30, 20);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text("Cesar Augusto Becerra Ramírez", 50, 15);
    doc.text("S.T.I. HERMABE", 50, 21);
    doc.setFontSize(10);
    doc.text("RIF: V-14368387-3", 50, 26);
    doc.text(
      "Carrera 7 N° 12-81, San Vicente, San Juan de Cólon, Edo. Táchira",
      50,
      31,
    );
    doc.text("Telfs: 0277-2912496 / 0424-7189106", 50, 36);

    /* =========================
           BLOQUE TÍTULO / N° RECIBO / FECHA
        ========================= */
    doc.setLineWidth(0.3);
    doc.rect(10, 45, 190, 20);
    doc.line(140, 45, 140, 65);
    doc.line(170, 45, 170, 65);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("RECIBO DE ABONO", 75, 57, { align: "center" });

    doc.setFontSize(9);
    doc.setTextColor(...rojoHermabe);
    doc.text("N° RECIBO", 155, 51, { align: "center" });
    doc.text("FECHA", 185, 51, { align: "center" });
    doc.setFontSize(12);
    doc.text(nRecibo, 155, 60, { align: "center" });
    doc.text(formatFecha(abono.fecha_abono), 185, 60, { align: "center" });
    doc.setTextColor(0, 0, 0);

    /* =========================
           DATOS DEL CLIENTE / PRESUPUESTO
        ========================= */
    let y = 75;
    const fila = (etiqueta, valor) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(etiqueta, 12, y);
      doc.setFont("helvetica", "normal");
      const lineas = doc.splitTextToSize(String(valor || "—"), 145);
      doc.text(lineas, 52, y);
      y += Math.max(lineas.length, 1) * 5 + 2;
    };

    fila("CLIENTE:", nombreCliente);
    if (cliente.rif) fila("RIF / C.I.:", cliente.rif);
    fila("PRESUPUESTO N°:", abono.n_presupuesto);
    fila("DESCRIPCIÓN:", (abono.descripcion_reporte || "—").toUpperCase());
    fila("REFERENCIA:", abono.referencia_pago || "S/N");

    /* =========================
           CONSTANCIA
        ========================= */
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const constancia =
      `Hemos recibido de ${nombreCliente} la cantidad de ${formatMonto(monto)} ` +
      `por concepto de abono al presupuesto N° ${abono.n_presupuesto}.`;
    const lineasConstancia = doc.splitTextToSize(constancia, 186);
    doc.text(lineasConstancia, 12, y);
    y += lineasConstancia.length * 5 + 4;

    /* =========================
           DETALLE DE MONTOS
        ========================= */
    autoTable(doc, {
      startY: y,
      head: [["CONCEPTO", "MONTO"]],
      body: [
        ["Monto total del presupuesto", formatMonto(total)],
        ["Abonos anteriores", formatMonto(abonosAnteriores)],
        ["MONTO DE ESTE ABONO", formatMonto(monto)],
        ["SALDO PENDIENTE", formatMonto(restante)],
      ],
      theme: "grid",
      margin: { left: 10, right: 10 },
      styles: { fontSize: 10 },
      headStyles: {
        fillColor: [230, 230, 230],
        textColor: 0,
        fontStyle: "bold",
      },
      columnStyles: {
        0: { cellWidth: 130 },
        1: { halign: "right" },
      },
      didParseCell: (data) => {
        if (data.section !== "body") return;
        if (data.row.index === 2) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.textColor = rojoHermabe;
        }
        if (data.row.index === 3) {
          data.cell.styles.fontStyle = "bold";
        }
      },
    });

    /* =========================
           FIRMA Y SELLO
        ========================= */
    const yFirma = doc.lastAutoTable.finalY + 30;
    doc.setLineWidth(0.3);
    doc.line(20, yFirma, 85, yFirma);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("RECIBIDO POR", 52.5, yFirma + 5, { align: "center" });
    doc.text("ING. CESAR BECERRA CIV N° 309740", 52.5, yFirma + 10, { align: "center" });

    doc.addImage(sello, "PNG", 140, yFirma - 15, 45, 15);

    /* =========================
           GUARDAR
        ========================= */
    doc.save(`Recibo_Abono_${abono.n_presupuesto || ""}_${nRecibo}.pdf`);
  };

  return { generarReciboAbono };
}
