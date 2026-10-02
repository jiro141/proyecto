import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../../../assets/img/Logotipo.png";
import sello from "../../../assets/img/sello.png";

export default function usePDFGenerator() {
  const generarPDF = (formData, nPresupuesto) => {
    const doc = new jsPDF("p", "mm", "a4");

    /* =========================
           ENCABEZADO
        ========================= */
    doc.addImage(logo, "PNG", 10, 10, 30, 20);
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
    doc.setFontSize(13);
    doc.text(`${formData?.orden_servicio}`, 155, 62, { align: "center" });
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

    const PAGE_H = doc.internal.pageSize.getHeight();
    const MARGEN_SUP = 15;
    const LIMITE = PAGE_H - 12; // margen inferior

    const HEAD = [
      ["N°", "DESCRIPCIÓN", "UND.", "CANT.", "PRECIO UNIT.", "PRECIO TOTAL"],
    ];

    // Anchos fijos: la tabla se dibuja en dos partes y deben quedar alineadas
    const tablaBase = {
      theme: "grid",
      styles: { fontSize: 9, halign: "center" },
      headStyles: {
        fillColor: [230, 230, 230],
        textColor: 0,
        fontStyle: "bold",
      },
      margin: { top: MARGEN_SUP, left: 14, right: 14 },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { halign: "left", cellWidth: 70 },
        2: { cellWidth: 18 },
        3: { cellWidth: 18 },
        4: { cellWidth: 32 },
        5: { cellWidth: 34 },
      },
    };

    /* =========================
           CIERRE: TOTALES, PIE, TÉRMINOS, NOTAS Y SELLO
        ========================= */
    const subtotal = formData.presupuesto_estimado || 0;
    const descuento = Number(formData.porcentaje_descuento || 0);
    const montoDescuento = subtotal * (descuento / 100);
    const total = subtotal - montoDescuento;

    const terminos = formData?.terminos_condiciones || "LOS PRECIOS NO INCLUYEN IVA; LO QUE NO ENCUENTRE EN EL PRESENTE PRESUPUESTO SERÁ PRESUPUESTADO POR APARTE.";

    // NOTA ESPECIAL PARA SAN SIMON
    const nombreCliente =
      formData?.cliente?.nombre?.trim()?.toUpperCase() || "";
    const esSanSimon = nombreCliente === "INVERSIONES LACTEAS SAN SIMON C.A";
    const notaSanSimon = "LOGISTICA, ALIMENTACION Y HOSPEDAJE ASUME SAN SIMON";

    const altoLinea = (d) =>
      (d.getFontSize() * d.getLineHeightFactor()) / d.internal.scaleFactor;

    // Dibuja el cierre desde yInicio y devuelve la Y final.
    // paginar=false se usa para medir el alto en un documento auxiliar.
    const dibujarCierre = (d, yInicio, paginar) => {
      // Si el bloque no entra en la página, continúa en una nueva
      const espacio = (y, alto) => {
        if (paginar && y + alto > LIMITE) {
          d.addPage();
          return MARGEN_SUP;
        }
        return y;
      };

      /* ---- TOTALES ---- */
      let finalY = espacio(yInicio + 10, 14);
      d.setFontSize(9);
      d.text(`SUB-TOTAL: $${subtotal.toFixed(2)}`, 150, finalY);
      if (descuento > 0) {
        d.text(`DESCUENTO (${descuento}%): -$${montoDescuento.toFixed(2)}`, 150, finalY + 7);
        d.text(`TOTAL: $${total.toFixed(2)}`, 150, finalY + 14);
      } else {
        d.text(`TOTAL: $${total.toFixed(2)}`, 150, finalY + 7);
      }

      /* ---- PIE DE DOCUMENTO ---- */
      finalY = espacio(finalY + 20, 21);
      d.setFont("helvetica", "bold");
      d.text("ELABORADO POR:", 10, finalY);
      d.setFont("helvetica", "normal");
      d.text("ING. CESAR BECERRA CIV N° 309740", 40, finalY);

      d.setFont("helvetica", "bold");
      d.text("FECHA:", 10, finalY + 7);
      d.setFont("helvetica", "normal");
      d.text(new Date().toLocaleDateString(), 25, finalY + 7);

      d.setFont("helvetica", "bold");
      d.text("VALIDEZ DE LA OFERTA:", 10, finalY + 14);
      d.setFont("helvetica", "normal");
      d.text(formData?.validez_oferta || "5 DÍAS", 50, finalY + 14);

      d.setFont("helvetica", "bold");
      d.text("FORMA DE PAGO:", 10, finalY + 21);
      d.setFont("helvetica", "normal");
      d.text(formData?.forma_pago || "60% ANTICIPO  40% A SU ENTREGA", 40, finalY + 21);

      /* ---- TÉRMINOS ---- */
      d.setFont("helvetica", "normal");
      const lineasTerminos = d.splitTextToSize(terminos, 190);
      finalY = espacio(finalY + 35, lineasTerminos.length * altoLinea(d));
      d.text(terminos, 10, finalY, { maxWidth: 190, align: "justify" });
      finalY += (lineasTerminos.length - 1) * altoLinea(d);

      /* ---- NOTAS ---- */
      const dibujarNota = (titulo, contenido) => {
        if (!titulo && !contenido) return;

        finalY += 15;

        if (titulo) {
          d.setFont("helvetica", "bold");
          d.setFontSize(15);
          d.setTextColor(0, 0, 0);
          // El título no queda solo al pie: necesita lugar para una línea más
          finalY = espacio(finalY, 8 + 5);
          d.text(titulo.toUpperCase(), 10, finalY);
          finalY += 8;
        }

        if (contenido) {
          d.setFont("helvetica", "normal");
          d.setFontSize(10);
          d.setTextColor(85, 85, 85);

          const lh = altoLinea(d);
          const lineas = d.splitTextToSize(contenido.toUpperCase(), 190);
          lineas.forEach((linea, i) => {
            finalY = espacio(finalY, lh);
            d.text(linea, 10, finalY);
            if (i < lineas.length - 1) finalY += lh;
          });
        }
      };

      // 👉 1. NOTA SAN SIMON (SI APLICA)
      if (esSanSimon) {
        dibujarNota("NOTA SAN SIMON", notaSanSimon);
      }

      // 👉 2. OTRAS NOTAS (SI EXISTEN)
      if (formData?.notas) {
        dibujarNota(formData?.titulo || "NOTA", formData?.notas);
      }

      /* ---- SELLO ---- */
      d.setTextColor(0, 0, 0);
      const ySello = espacio(finalY + 15, 15);
      d.addImage(sello, "PNG", 155, ySello, 45, 15);

      return ySello + 15;
    };

    /* =========================
           MEDICIONES (documento auxiliar muy alto, sin saltos de página)
        ========================= */
    const nuevoMedidor = () => new jsPDF("p", "mm", [210, 3000]);

    const altoCierre = dibujarCierre(nuevoMedidor(), 0, false);

    const body = rows.map((r) => Object.values(r));
    const ultimaFila = body[body.length - 1];
    const filasPrevias = body.slice(0, -1);

    const medirTabla = (filas, conHead) => {
      const medidor = nuevoMedidor();
      autoTable(medidor, {
        ...tablaBase,
        startY: 0,
        head: HEAD,
        showHead: conHead ? "firstPage" : "never",
        body: filas,
      });
      return medidor.lastAutoTable.finalY;
    };

    /* =========================
           TABLA EN DOS PARTES
           Si la última fila + el cierre (con las notas) no entran en la
           página, la última fila pasa a la página siguiente junto al cierre.
        ========================= */
    let yTabla = cursorY;

    if (!ultimaFila) {
      // Sin APUs: solo el encabezado de la tabla
      autoTable(doc, { ...tablaBase, startY: yTabla, head: HEAD, body: [] });
    } else {
      if (filasPrevias.length) {
        autoTable(doc, { ...tablaBase, startY: yTabla, head: HEAD, body: filasPrevias });
        yTabla = doc.lastAutoTable.finalY;
      }

      let conHead = filasPrevias.length === 0;
      const altoUltima = medirTabla([ultimaFila], conHead);

      // Solo se mueve si hay filas previas: mover la única fila dejaría
      // la primera página con el encabezado solo
      if (filasPrevias.length && yTabla + altoUltima + altoCierre > LIMITE) {
        doc.addPage();
        yTabla = MARGEN_SUP;
        conHead = true;
      }

      autoTable(doc, {
        ...tablaBase,
        startY: yTabla,
        head: HEAD,
        showHead: conHead ? "firstPage" : "never",
        body: [ultimaFila],
      });
    }

    dibujarCierre(doc, doc.lastAutoTable.finalY, true);

    /* =========================
           GUARDAR
        ========================= */
    doc.save(
      `${nPresupuesto}_${formData?.descripcion}_${formData?.cliente?.nombre || ""}.pdf`,
    );
  };

  return { generarPDF };
}
