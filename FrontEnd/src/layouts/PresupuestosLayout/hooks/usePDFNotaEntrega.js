import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../../../assets/img/Logotipo.png";
import sello from "../../../assets/img/sello.png";

export default function usePDFNotaEntrega() {
  const generarPDF = (notaEntrega, reporte, items) => {
    const doc = new jsPDF("p", "mm", "letter");

    const nNota = notaEntrega?.n_nota || "1100";
    const codigo = notaEntrega?.codigo || "";
    const fecha =
      notaEntrega?.fecha_entrega
        ? new Date(notaEntrega.fecha_entrega).toLocaleDateString("es-VE", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
        : new Date().toLocaleDateString("es-VE");

    const cliente = notaEntrega?.cliente_nombre || reporte?.cliente?.nombre || "—";
    const rif = notaEntrega?.cliente_rif || reporte?.cliente?.rif || "—";
    const presupuesto = reporte?.n_presupuesto || "—";
    const ordenCompra = notaEntrega?.orden_compra || "";

    const rojo = [255, 0, 0];
    const azul = [31, 55, 100];
    const grisBorde = [200, 200, 200];

    doc.setFont("helvetica");

    // Logo superior - más arriba y más grande
    doc.addImage(logo, "PNG", 125.5, 8, 50, 22);

    doc.setTextColor(...azul);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Cesar Augusto Becerra Ramirez", 107, 18, { align: "center" });
    doc.text("S.T.I HERMABE", 107, 24, { align: "center" });
    doc.text("RIF V-14368387-3", 107, 29, { align: "center" });

    doc.setTextColor(0);
    doc.setFontSize(9);
    doc.text(
      "CARRERA 7 CASA N°12-81 SECTOR BARRIO SAN VICENTE-SAN JUAN DE COLON-ESTADO TACHIRA",
      107,
      40,
      { align: "center" }
    );

    // ===========================
    // BLOQUE 1: NOTA DE ENTREGA Y FECHA
    // ===========================
    doc.setLineWidth(0.5);
    doc.setDrawColor(...grisBorde);
    
    // Rectángulo principal (mismo ancho que la tabla de abajo: 159.4)
    doc.rect(27.7, 48, 159.4, 10.2);
    
    // Línea vertical divisora (solo una)
    doc.line(107, 48, 107, 58.2);
    doc.line(27.7, 53.4, 187.1, 53.4);
    
    // Nota de entrega
    doc.setTextColor(...rojo);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("NOTA DE ENTREGA", 67, 51.6, { align: "center" });
    doc.setFontSize(10);
    doc.text(String(nNota), 67, 56.7, { align: "center" });
    
    // Fecha
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("FECHA", 147, 51.6, { align: "center" });
    doc.setFontSize(10);
    doc.text(fecha, 147, 56.7, { align: "center" });

    // ===========================
    // BLOQUE 2: CLIENTE Y RIF
    // ===========================
    doc.setDrawColor(...grisBorde);
    doc.rect(27.7, 62.5, 159.4, 10.2);
    doc.line(68.9, 62.5, 68.9, 72.7);
    doc.line(27.7, 67.9, 187.1, 67.9);

    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("CLIENTE:", 28.5, 66.4);
    doc.text("RIF:", 28.5, 71.3);
    
    doc.setFont("helvetica", "normal");
    doc.text(cliente.toUpperCase(), 68.9, 66.4, { maxWidth: 90 });
    doc.text(rif.toUpperCase(), 68.9, 71.3, { maxWidth: 90 });

    // ===========================
    // BLOQUE 3: PRESUPUESTO Y ORDEN DE COMPRA
    // ===========================
    doc.setDrawColor(...grisBorde);
    doc.rect(27.7, 76, 159.4, 10.2);
    doc.line(107, 76, 107, 86.2);
    doc.line(27.7, 81.4, 187.1, 81.4);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    
    // Presupuesto
    doc.text("PRESUPUESTO", 67, 80, { align: "center" });
    doc.text(presupuesto, 67, 85, { align: "center" });
    
    // Orden Compra
    doc.text("ORDEN COMPRA", 147, 80, { align: "center" });
    doc.text(ordenCompra || "—", 147, 85, { align: "center" });

    // ===========================
    // TABLA DE ITEMS
    // ===========================
    const rows = (items || []).map((item) => {
      const cantidad = parseFloat(item.cantidad_entregada) || 0;
      const precio = parseFloat(item.precio_unitario) || 0;
      const monto = cantidad * precio;
      return [
        String(cantidad),
        (item.apu_descripcion || "—").toUpperCase(),
        `$${precio.toFixed(2)}`,
        `$${monto.toFixed(2)}`,
      ];
    });

    const total = (items || []).reduce((sum, item) => {
      const cantidad = parseFloat(item.cantidad_entregada) || 0;
      const precio = parseFloat(item.precio_unitario) || 0;
      return sum + cantidad * precio;
    }, 0);

    autoTable(doc, {
      startY: 90,
      head: [["CANTIDAD", "DESCRIPCIÓN", "PRECIO UNITARIO", "MONTO"]],
      body: rows,
      theme: "grid",
      styles: {
        fontSize: 9,
        halign: "center",
        lineColor: [150, 150, 150],
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: [217, 225, 242],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        fontSize: 9,
        lineWidth: 0.2,
        lineColor: [150, 150, 150],
      },
      columnStyles: {
        0: { halign: "center", cellWidth: 20 },
        1: { halign: "left", cellWidth: 90 },
        2: { halign: "right", cellWidth: 28 },
        3: { halign: "right", cellWidth: 28 },
      },
      margin: { left: 28, right: 25 },
    });

    // ===========================
    // TOTAL
    // ===========================
    let finalY = doc.lastAutoTable.finalY + 8;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...rojo);
    doc.text(`VALOR TOTAL: $${total.toFixed(2)}`, 170, finalY, { align: "right" });
    doc.setTextColor(0, 0, 0);

    // Sello
    doc.addImage(sello, "PNG", 47, finalY - 5, 32.2, 11.2);

    // Observaciones
    if (notaEntrega?.observaciones) {
      finalY += 15;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("OBSERVACIONES:", 28, finalY);
      doc.setFont("helvetica", "normal");
      finalY += 5;
      const obsLineas = doc.splitTextToSize(notaEntrega.observaciones, 160);
      doc.text(obsLineas, 28, finalY);
    }

    doc.save(`${nNota}_nota_entrega.pdf`);
  };

  return { generarPDF };
}