// src/hooks/useExcelGenerator.js
import * as XLSX from "xlsx-js-style";
import {
  agregarMembrete,
  ajustarAlto,
  columnWidths,
  combinar,
  excelStyles,
  resumenColumnWidths,
} from "./presupuestoExcelLayout";
import { guardarPresupuestoExcel } from "./guardarPresupuestoExcel";
import { usePresupuesto } from "../../../context/PresupuestoContext";

// Función para limpiar caracteres inválidos de nombres de hojas en Excel
const cleanSheetName = (name, usedNames = new Set()) => {
  const base = name?.replace(/[\\/:*?[\]]/g, "").slice(0, 31).trim().replace(/^'+|'+$/g, "") || "APU";
  let sheetName = base;
  let counter = 1;
  while (usedNames.has(sheetName.toLowerCase())) {
    const suffix = `_${counter++}`;
    sheetName = `${base.slice(0, 31 - suffix.length)}${suffix}`;
  }

  usedNames.add(sheetName.toLowerCase());
  return sheetName;
};

const estilizarFila = (ws, row, columns, styleForColumn) => {
  for (const col of columns) {
    const cell = ws[`${col}${row}`];
    if (cell) cell.s = styleForColumn(col);
  }
};

export default function useExcelGenerator() {
  const { formData: presupuestoActual } = usePresupuesto();

  const generarExcelAPUs = (datos, nPresupuesto) => {
    const formData = datos ?? presupuestoActual;
    if (!formData?.apus?.length) return;

    // ✅ función helpers - definida primero para usarla en todo el scope
    const toNumber = (value, fallback = 0) => {
      if (value === null || value === undefined || value === "")
        return fallback;

      const normalized =
        typeof value === "string"
          ? (() => {
              let str = value.trim();

              const hasComma = str.includes(",");
              const hasDot = str.includes(".");

              if (hasComma && hasDot) {
                if (str.lastIndexOf(",") > str.lastIndexOf(".")) {
                  str = str.replace(/\./g, "").replace(",", ".");
                } else {
                  str = str.replace(/,/g, "");
                }
              } else if (hasComma) {
                str = str.replace(",", ".");
              }

              return Number(str);
            })()
          : Number(value);

      return Number.isFinite(normalized) ? normalized : fallback;
    };

    // ✅ Calcular total real sumando los presupuesto_base de cada APU
    const apus = formData?.apus || [];
    const total = apus.reduce((acc, apu) => {
      return acc + toNumber(apu.body?.presupuesto_base || 0);
    }, 0);

    const wb = XLSX.utils.book_new();

    /* =========================
           HOJA 1: RESUMEN (como PDF)
        ========================= */
    const wsResumen = XLSX.utils.aoa_to_sheet([]);
    wsResumen["!cols"] = resumenColumnWidths;
    agregarMembrete(wsResumen, "F");

    const clienteNombre = formData.cliente?.nombre?.toUpperCase() || "—";
    const clienteRif = formData.cliente?.rif ? `, ${formData.cliente.rif}` : "";
    const clienteTexto = `${clienteNombre}${clienteRif}`;
    const descripcion = formData.descripcion?.toUpperCase() || "—";

    combinar(wsResumen, "A7:F7", "PRESUPUESTO", excelStyles.tituloPrincipal);
    ajustarAlto(wsResumen, 7, [], 26);
    combinar(wsResumen, "B8:C8", clienteTexto, excelStyles.texto);
    combinar(wsResumen, "D8:E8", "ORDEN DE SERVICIO", excelStyles.referenciaLabel);
    combinar(wsResumen, "D9:E9", formData.orden_servicio || "—", excelStyles.referenciaValue);
    XLSX.utils.sheet_add_aoa(wsResumen, [["CLIENTE:"]], { origin: "A8" });
    wsResumen.A8.s = excelStyles.resumenLabel;
    XLSX.utils.sheet_add_aoa(
      wsResumen,
      [["N° PRESUPUESTO"], [String(nPresupuesto || "----")]],
      { origin: "F8" },
    );
    wsResumen.F8.s = excelStyles.referenciaLabel;
    wsResumen.F9.s = excelStyles.referenciaValue;
    ajustarAlto(wsResumen, 8, [
      { value: clienteTexto, columns: [1, 2] },
      { value: "ORDEN DE SERVICIO", columns: [3, 4], fontSize: 10, bold: true },
      { value: "N° PRESUPUESTO", columns: [5], fontSize: 10, bold: true },
    ], 22);
    ajustarAlto(wsResumen, 9, [
      { value: formData.orden_servicio, columns: [3, 4], fontSize: 12, bold: true },
    ], 22);

    combinar(wsResumen, "A11:F11", descripcion, excelStyles.subtitulo);
    ajustarAlto(wsResumen, 11, [
      { value: descripcion, columns: [0, 1, 2, 3, 4, 5], bold: true },
    ], 26);

    const resumenHeaders = ["N°", "DESCRIPCIÓN", "UND.", "CANT.", "PRECIO UNIT.", "PRECIO TOTAL"];
    const filaEncabezadoResumen = 13;
    XLSX.utils.sheet_add_aoa(wsResumen, [resumenHeaders], { origin: `A${filaEncabezadoResumen}` });
    estilizarFila(wsResumen, filaEncabezadoResumen, "ABCDEF", () => excelStyles.tablaHeader);
    ajustarAlto(wsResumen, filaEncabezadoResumen, resumenHeaders.map((value, col) => ({ value, columns: [col], bold: true })), 25);

    let filaResumen = filaEncabezadoResumen + 1;

    apus.forEach((apu, index) => {
      const cantidad = apu.body?.cantidad || 1;
      const presupuestoBase = apu.body?.presupuesto_base || 0;
      const descripcionAPU = apu.body?.descripcion || "—";
      const unidad = apu.body?.unidad || "UND";
      const row = [index + 1, descripcionAPU, unidad, cantidad, presupuestoBase / cantidad, presupuestoBase];

      XLSX.utils.sheet_add_aoa(wsResumen, [row], { origin: `A${filaResumen}` });
      estilizarFila(wsResumen, filaResumen, "ABCDEF", (col) => {
        if (col === "B") return excelStyles.tablaDescripcion;
        if (col === "E" || col === "F") return excelStyles.tablaMonto;
        return excelStyles.tablaCelda;
      });
      ajustarAlto(wsResumen, filaResumen, [
        { value: descripcionAPU, columns: [1] },
        { value: unidad, columns: [2] },
      ]);
      filaResumen++;
    });

    XLSX.utils.sheet_add_aoa(
      wsResumen,
      [["SUB-TOTAL:", total], ["TOTAL:", total]],
      { origin: `E${filaResumen + 1}` },
    );
    estilizarFila(wsResumen, filaResumen + 1, "EF", (col) => (
      col === "E" ? excelStyles.resumenLabel : excelStyles.resumenValue
    ));
    estilizarFila(wsResumen, filaResumen + 2, "EF", (col) => (
      col === "E" ? excelStyles.resumenLabel : excelStyles.resumenValue
    ));

    const pie = [
      ["ELABORADO POR:", "ING. CESAR BECERRA CIV N° 309740"],
      ["FECHA:", (formData.fecha_creacion ? new Date(formData.fecha_creacion) : new Date()).toLocaleDateString()],
      ["VALIDEZ DE LA OFERTA:", formData.validez_oferta || "5 DÍAS"],
      ["FORMA DE PAGO:", formData.forma_pago || "60% ANTICIPO  40% A SU ENTREGA"],
    ];
    pie.forEach(([label, value], index) => {
      const row = filaResumen + 4 + index;
      combinar(wsResumen, `A${row}:B${row}`, label, excelStyles.resumenLabel);
      combinar(wsResumen, `C${row}:F${row}`, value, excelStyles.texto);
      ajustarAlto(wsResumen, row, [{ value, columns: [2, 3, 4, 5] }]);
    });

    const terminos = formData.terminos_condiciones
      || "LOS PRECIOS NO INCLUYEN IVA; LO QUE NO SE ENCUENTRE EN EL PRESENTE PRESUPUESTO SERÁ PRESUPUESTADO POR APARTE.";
    const filaTerminos = filaResumen + 9;
    combinar(wsResumen, `A${filaTerminos}:F${filaTerminos}`, terminos, excelStyles.texto);
    ajustarAlto(wsResumen, filaTerminos, [{ value: terminos, columns: [0, 1, 2, 3, 4, 5] }]);

    XLSX.utils.book_append_sheet(wb, wsResumen, "RESUMEN");

    /* =========================
           HOJAS APU
        ========================= */
    const usedSheetNames = new Set(["resumen", "history"]);
    formData.apus.forEach((apu, index) => {
      const ws = XLSX.utils.aoa_to_sheet([]);
      const hojaNombre = cleanSheetName(
        apu.body?.descripcion?.substring(0, 28) || `APU_${index + 1}`,
        usedSheetNames
      );

      ws["!cols"] = columnWidths;
      agregarMembrete(ws, "G");

      const descripcionAPU = apu.body?.descripcion?.toUpperCase() || "SIN DESCRIPCIÓN";
      combinar(ws, "A6:G6", "ANÁLISIS DE PRECIOS UNITARIOS", excelStyles.tituloPrincipal);
      combinar(ws, "A7:G7", descripcionAPU, excelStyles.subtitulo);
      ajustarAlto(ws, 6, [], 26);
      ajustarAlto(ws, 7, [
        { value: descripcionAPU, columns: [0, 1, 2, 3, 4, 5, 6], bold: true },
      ], 26);

      let currentRow = 9;

      const rendimiento = apu.body?.rendimiento || 1;
      const unidad = apu.body?.unidad || "UND";
      const cantidad = apu.body?.cantidad || 1;

      XLSX.utils.sheet_add_aoa(
        ws,
        [["RENDIMIENTO", rendimiento, "UNIDAD", unidad, "CANTIDAD", cantidad]],
        { origin: `A${currentRow}` },
      );
      estilizarFila(ws, currentRow, "ACE", () => excelStyles.tablaHeader);
      estilizarFila(ws, currentRow, "BDF", () => excelStyles.tablaCelda);
      ajustarAlto(ws, currentRow, [
        { value: "RENDIMIENTO", columns: [0], bold: true },
        { value: unidad, columns: [3] },
      ], 21);
      currentRow += 2;

      const agregarTabla = (titulo, headers, data) => {
        combinar(ws, `A${currentRow}:G${currentRow}`, titulo, excelStyles.seccionTitulo);
        ajustarAlto(ws, currentRow, [], 22);
        currentRow++;

        XLSX.utils.sheet_add_aoa(ws, [headers], { origin: `A${currentRow}` });
        estilizarFila(ws, currentRow, "ABCDEFG", () => excelStyles.tablaHeader);
        ajustarAlto(ws, currentRow, headers.map((value, col) => ({ value, columns: [col], bold: true })), 24);
        currentRow++;

        const startRow = currentRow;
        const estiloPartida = (col) => {
          if (col === "B") return excelStyles.tablaDescripcion;
          if (col === "F" || col === "G") return excelStyles.tablaMonto;
          return excelStyles.tablaCelda;
        };

        if (!data || data.length === 0) {
          XLSX.utils.sheet_add_aoa(ws, [["", "", "", 0, 0, 0, 0]], {
            origin: `A${currentRow}`,
          });
          estilizarFila(ws, currentRow, "ABCDEFG", estiloPartida);
          ajustarAlto(ws, currentRow, []);
          currentRow++;
        } else {
          data.forEach((item) => {
            XLSX.utils.sheet_add_aoa(
              ws,
              [
                [
                  item.codigo || "",
                  item.descripcion || "",
                  item.unidad || "",
                  toNumber(item.cantidad),
                  toNumber(item.desp),
                  toNumber(
                    item.costo ??
                      item.precio_unitario ??
                      item.depreciacion_bs_hora,
                  ),
                  null,
                ],
              ],
              { origin: `A${currentRow}` },
            );

            ws[`G${currentRow}`] = {
              f: `=D${currentRow}*(1+E${currentRow}/100)*F${currentRow}`,
            };

            estilizarFila(ws, currentRow, "ABCDEFG", estiloPartida);
            ajustarAlto(ws, currentRow, [
              { value: item.codigo, columns: [0] },
              { value: item.descripcion, columns: [1] },
              { value: item.unidad, columns: [2] },
            ]);
            currentRow++;
          });
        }

        XLSX.utils.sheet_add_aoa(ws, [["", "", "", "", "", "TOTAL", null]], {
          origin: `A${currentRow}`,
        });

        const totalFormula = `IFERROR(SUM(G${startRow}:G${currentRow - 1}),0)`;

        ws[`G${currentRow}`] = titulo
          .toUpperCase()
          .includes("COSTO DE HERRAMIENTAS")
          ? { f: `=IF(B9<>0, ${totalFormula}, 0)` }
          : { f: `=${totalFormula}` };

        ws[`F${currentRow}`].s = excelStyles.resumenLabel;
        ws[`G${currentRow}`].s = excelStyles.resumenValue;
        ajustarAlto(ws, currentRow, [], 20);

        currentRow += 2;

        return currentRow - 1;
      };

      const materiales = [
        ...(apu.materiales?.stock_almacen || []),
        ...(apu.materiales?.consumibles || []),
        ...(apu.materiales?.epps || []),
      ];
      const herramientas = apu.herramientas || [];
      const mano_obra = apu.mano_obra || [];
      const logistica = apu.logistica || [];

      const totalMatRow = agregarTabla(
        "COSTO DE MATERIALES",
        [
          "CÓDIGO",
          "DESCRIPCIÓN",
          "UNIDAD",
          "CANTIDAD",
          "% DESP",
          "PRECIO UNITARIO",
          "TOTAL",
        ],
        materiales,
      );
      const totalHerrRow = agregarTabla(
        "COSTO DE HERRAMIENTAS",
        ["CÓDIGO", "DESCRIPCIÓN", "UNIDAD", "CANTIDAD", "", "COSTO", "TOTAL"],
        herramientas,
      );
      const totalMoRow = agregarTabla(
        "MANO DE OBRA",
        [
          "CÓDIGO",
          "DESCRIPCIÓN",
          "UNIDAD",
          "CANTIDAD",
          "",
          "PRECIO UNITARIO",
          "TOTAL",
        ],
        mano_obra,
      );
      const totalLogRow = agregarTabla(
        "LOGÍSTICA",
        [
          "CÓDIGO",
          "DESCRIPCIÓN",
          "UNIDAD",
          "CANTIDAD",
          "",
          "PRECIO UNITARIO",
          "TOTAL",
        ],
        logistica,
      );

      const resumenStart = currentRow;
      const row = resumenStart;
      const safe = (v) => (v ? v : 0);

      XLSX.utils.sheet_add_aoa(
        ws,
        [
          ["TOTAL MATERIALES", { f: `IFERROR(G${safe(totalMatRow) - 1},0)` }],
          [
            "TOTAL HERRAMIENTAS",
            { f: `IFERROR(G${safe(totalHerrRow) - 1}/B9,0)` },
          ],
          [
            "TOTAL MANO DE OBRA BASE",
            {
              f: `IFERROR(G${safe(totalMoRow) - 1},0)`,
            },
          ],
          [
            "BONO ALIMENTICIO ($15 × Días)",
            {
              f: `IFERROR(SUM(D${safe(totalMoRow - 1 - mano_obra.length)}:D${safe(totalMoRow - 1)})*15,0)`,
            },
          ],
          [
            "PRESTACIONES SOCIALES (200%)",
            { f: `IFERROR(F${safe(row) + 2}*2,0)` },
          ],
          [
            "TOTAL MANO DE OBRA",
            {
              f: `IFERROR(F${safe(row) + 2}+F${safe(row) + 3}+F${safe(row) + 4}+G${safe(totalLogRow) - 1},0)`,
            },
          ],
          ["COSTO POR UNIDAD", { f: `IFERROR(F${safe(row) + 5}/B9,0)` }],
          [
            "COSTO DIRECTO POR UNIDAD",
            {
              f: `IFERROR(F${safe(row)}+F${safe(row) + 1}+F${safe(row) + 6},0)`,
            },
          ],
          [
            "15% ADMINISTRACIÓN Y GASTOS",
            { f: `IFERROR(F${safe(row) + 7}*0.15,0)` },
          ],
          ["SUBTOTAL", { f: `IFERROR(F${safe(row) + 7}+F${safe(row) + 8},0)` }],
          ["15% UTILIDAD", { f: `IFERROR(F${safe(row) + 9}*0.15,0)` }],
          [
            "TOTAL UNITARIO",
            { f: `IFERROR(F${safe(row) + 9}+F${safe(row) + 10},0)` },
          ],
        ],
        { origin: `E${resumenStart}` },
      );

      for (let i = 0; i < 12; i++) {
        const summaryRow = resumenStart + i;
        const labelAddress = `E${summaryRow}`;
        const label = ws[labelAddress].v;
        combinar(ws, `B${summaryRow}:E${summaryRow}`, label, excelStyles.resumenLabel);
        ws[`F${summaryRow}`].s = excelStyles.resumenValue;
        ajustarAlto(ws, summaryRow, [], 19);
      }

      XLSX.utils.book_append_sheet(wb, ws, hojaNombre);
    });

    guardarPresupuestoExcel(
      wb,
      `${nPresupuesto}_${cleanSheetName(formData?.descripcion)}_${cleanSheetName(formData?.cliente?.nombre)}_${
        new Date().toISOString().split("T")[0]
      }.xlsx`,
    );
  };

  return { generarExcelAPUs };
}
