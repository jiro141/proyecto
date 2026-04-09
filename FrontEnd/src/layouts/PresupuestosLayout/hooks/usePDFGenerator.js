import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../../../assets/img/Logotipo.png";
import sello from "../../../assets/img/sello.png";

export default function usePDFGenerator() {
  const generarPDF = (formData, nPresupuesto) => {
    const doc = new jsPDF("p", "mm", "a4");
    console.log(formData);

    /* =========================
           ENCABEZADO
        ========================= */
    doc.addImage(logo, "PNG", 10, 10, 30, 20);
    doc.setFontSize(12);
    doc.text("Cesar Augusto Becerra Ramírez", 50, 15);
    doc.text("S.T.I. HERMABE", 50, 21);
    doc.setFontSize(10);
    doc.text("RIF: V-14368837-3", 50, 26);
    doc.text(
      "Carrera 7 N° 12-81, San Vicente, San Cristóbal, Edo. Táchira",
      50,
      31,
    );
    doc.text("Telfs: 0277-2912496 / 0424-7189106", 50, 36);

    const rojoHermabe = [227, 6, 19];

    /* =========================
           BLOQUE CLIENTE / PRESUPUESTO
        ========================= */
    doc.setLineWidth(0.3);
    doc.rect(10, 45, 190, 20);
    doc.line(10, 55, 200, 55);
    doc.line(140, 45, 140, 65);
    doc.line(170, 45, 170, 65);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("PRESUPUESTO", 75, 52, { align: "center" });

    doc.setTextColor(...rojoHermabe);
    doc.text("ORDEN DE", 155, 50, { align: "center" });
    doc.text("SERVICIO", 155, 54, { align: "center" });
    doc.setTextColor(0, 0, 0);

    doc.setFontSize(9);
    doc.text("CLIENTE:", 12, 62);

    doc.setFont("helvetica", "normal");
    const clienteTexto = `${formData?.cliente?.nombre?.toUpperCase() || "—"}${
      formData?.cliente?.rif ? `, ${formData.cliente.rif}` : ""
    }`;
    doc.text(clienteTexto, 35, 62);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(...rojoHermabe);
    doc.text("N°", 185, 50, { align: "center" });
    doc.text("PRESUPUESTO", 185, 53, { align: "center" });
    doc.setFontSize(13);
    doc.text(String(nPresupuesto || "----"), 185, 62, { align: "center" });
    doc.setTextColor(0, 0, 0);

    /* =========================
           DESCRIPCIÓN DINÁMICA
        ========================= */
    let cursorY = 73;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);

    const descripcion = formData?.descripcion?.toUpperCase() || "—";
    const descripcionLineas = doc.splitTextToSize(descripcion, 180);

    doc.text(descripcionLineas, 105, cursorY, {
      align: "center",
    });

    const lineHeight = 6;
    cursorY += descripcionLineas.length * lineHeight + 4;

    /* =========================
           TABLA APUS (DINÁMICA)
        ========================= */
    const rows = (formData?.apus || []).map((apu, index) => ({
      n: index + 1,
      descripcion: apu.body?.descripcion || "—",
      unidad: apu.body?.unidad || "UND",
      cantidad: apu.body?.cantidad || 1,
      precio_unit: `$${(
        (apu.body?.presupuesto_base || 0) / (apu.body?.cantidad || 1)
      ).toFixed(2)}`,
      precio_total: `$${(apu.body?.presupuesto_base || 0).toFixed(2)}`,
    }));

    autoTable(doc, {
      startY: cursorY,
      head: [
        ["N°", "DESCRIPCIÓN", "UND.", "CANT.", "PRECIO UNIT.", "PRECIO TOTAL"],
      ],
      body: rows.map((r) => Object.values(r)),
      theme: "grid",
      styles: { fontSize: 9, halign: "center" },
      headStyles: {
        fillColor: [230, 230, 230],
        textColor: 0,
        fontStyle: "bold",
      },
      columnStyles: {
        1: { halign: "left", cellWidth: 70 },
      },
    });

    /* =========================
           TOTALES
        ========================= */
    let finalY = doc.lastAutoTable.finalY + 10;
    const total = formData.presupuesto_estimado || 0;

    doc.setFontSize(9);
    doc.text(`SUB-TOTAL: $${total.toFixed(2)}`, 150, finalY);
    doc.text(`TOTAL: $${total.toFixed(2)}`, 150, finalY + 7);

    /* =========================
           PIE DE DOCUMENTO
        ========================= */
    finalY += 20;
    doc.setFont("helvetica", "bold");
    doc.text("ELABORADO POR:", 10, finalY);
    doc.setFont("helvetica", "normal");
    doc.text("ING. CESAR BECERRA CIV N° 309740", 40, finalY);

    doc.setFont("helvetica", "bold");
    doc.text("FECHA:", 10, finalY + 7);
    doc.setFont("helvetica", "normal");
    doc.text(new Date().toLocaleDateString(), 25, finalY + 7);

    doc.setFont("helvetica", "bold");
    doc.text("VALIDEZ DE LA OFERTA:", 10, finalY + 14);
    doc.setFont("helvetica", "normal");
    doc.text("5 DÍAS", 50, finalY + 14);

    doc.setFont("helvetica", "bold");
    doc.text("FORMA DE PAGO:", 10, finalY + 21);
    doc.setFont("helvetica", "normal");
    doc.text("60% ANTICIPO  40% A SU ENTREGA", 40, finalY + 21);

    finalY += 35;
    doc.setFont("helvetica", "normal");
    doc.text(
      "LOS PRECIOS NO INCLUYEN IVA; LO QUE NO ENCUENTRE EN EL PRESENTE PRESUPUESTO SERÁ PRESUPUESTADO POR APARTE.",
      10,
      finalY,
      { maxWidth: 190, align: "justify" },
    );

    // NOTA ESPECIAL PARA SAN SIMON
    const nombreCliente = formData?.cliente?.nombre?.trim()?.toUpperCase() || "";
    const rifCliente = formData?.cliente?.rif?.trim()?.toUpperCase() || "";

    const esSanSimon =
      nombreCliente === "INVERSIONES LACTEAS SAN SIMON C.A" &&
      rifCliente === "J-412577999";

    // MOSTRAR NOTA
    const titulo = esSanSimon ? "NOTA" : formData?.titulo;
    const notas = esSanSimon
      ? "LOGISTICA, ALIMENTACION Y HOSPEDAJE ASUME SAN SIMON"
      : formData?.notas;

    if (titulo || notas) {
      finalY += 30;

      if (titulo) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(15);
        doc.setTextColor(0, 0, 0);
        doc.text(titulo.toUpperCase(), 10, finalY);
        finalY += 8;
      }

      if (notas) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(85, 85, 85);

        const notasLineas = doc.splitTextToSize(notas.toUpperCase(), 190);
        doc.text(notasLineas, 10, finalY);
      }
    }

    doc.setTextColor(0, 0, 0);
    doc.addImage(sello, "PNG", 155, finalY + 15, 45, 15);

    /* =========================
           GUARDAR
        ========================= */
    doc.save(
      `${nPresupuesto}_${formData?.descripcion}_${formData?.cliente?.nombre || ""}.pdf`,
    );
  };

  return { generarPDF };
}