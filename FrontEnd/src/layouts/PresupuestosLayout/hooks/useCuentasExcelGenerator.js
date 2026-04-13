// src/hooks/useCuentasExcelGenerator.js
import * as XLSX from "xlsx-js-style";
import { excelStyles } from "./useExcelStyles";

export default function useCuentasExcelGenerator() {
  const generarExcelCuentas = (data, totales, fechaDesde, fechaHasta) => {
    if (!data || data.length === 0) return;

    const toNumber = (value, fallback = 0) => {
      if (value === null || value === undefined || value === "") return fallback;
      const normalized =
        typeof value === "string"
          ? Number(value.replace(/\./g, "").replace(",", ".").trim())
          : Number(value);
      return Number.isFinite(normalized) ? normalized : fallback;
    };

    const formatDate = (dateStr) => {
      if (!dateStr) return "—";
      const date = new Date(dateStr);
      return date.toLocaleDateString("es-VE");
    };

    const formatCurrency = (value) => {
      const num = toNumber(value);
      return num;
    };

    const wb = XLSX.utils.book_new();

    /* =========================
           HOJA 1: RESUMEN
        ========================= */
    const wsResumen = XLSX.utils.aoa_to_sheet([]);

    // Fechas del reporte
    const fechaReporte = new Date().toLocaleDateString("es-VE");
    const tituloDesde = fechaDesde ? formatDate(fechaDesde) : "—";
    const tituloHasta = fechaHasta ? formatDate(fechaHasta) : "—";

    // Encabezado empresa
    XLSX.utils.sheet_add_aoa(
      wsResumen,
      [
        ["Cesar Augusto Becerra Ramírez"],
        ["S.T.I. HERMABE"],
        ["RIF: V-14368837-3"],
        ["Carrera 7 N° 12-81, San Vicente, San Cristóbal, Edo. Táchira"],
        ["Telfs: 0277-2912496 / 0424-7189106"],
        [],
        ["RESUMEN DE CUENTAS POR COBRAR"],
        [],
        ["Período:", `${tituloDesde} al ${tituloHasta}`],
        [],
        ["FECHA DE REPORTE:", fechaReporte],
        [],
        [],
        ["RESUMEN TOTALES"],
        [],
        ["TOTAL FACTURADO", formatCurrency(totales?.total_facturado)],
        ["TOTAL ABONADO", formatCurrency(totales?.total_abonado)],
        ["TOTAL PENDIENTE", formatCurrency(totales?.total_pendiente)],
      ],
      { origin: "A1" }
    );

    // Aplicar estilos
    if (wsResumen["A1"]) wsResumen["A1"].s = excelStyles.empresaTitulo;
    if (wsResumen["A2"]) wsResumen["A2"].s = excelStyles.tituloPrincipal;
    if (wsResumen["A3"]) wsResumen["A3"].s = excelStyles.empresaSubtitulo;
    if (wsResumen["A4"]) wsResumen["A4"].s = excelStyles.empresaDireccion;
    if (wsResumen["A5"]) wsResumen["A5"].s = excelStyles.empresaDireccion;
    if (wsResumen["A7"]) wsResumen["A7"].s = excelStyles.tituloPrincipal;
    if (wsResumen["A13"]) wsResumen["A13"].s = excelStyles.subtitulo;

    // Estilos para totales
    ["A16", "A17", "A18"].forEach((cell) => {
      if (wsResumen[cell]) wsResumen[cell].s = excelStyles.resumenLabel;
    });
    ["B16", "B17", "B18"].forEach((cell) => {
      if (wsResumen[cell]) {
        wsResumen[cell].s = { ...excelStyles.resumenValue, font: { bold: true } };
      }
    });

    // Anchos de columna
    wsResumen["!cols"] = [{ wch: 20 }, { wch: 18 }];

    XLSX.utils.book_append_sheet(wb, wsResumen, "RESUMEN");

    /* =========================
           HOJA 2: DETALLE
        ========================= */
    const wsDetalle = XLSX.utils.aoa_to_sheet([]);

    // Headers
    const detalleHeaders = [
      [
        "N°",
        "PRESUPUESTO",
        "CLIENTE",
        "DESCRIPCIÓN",
        "TOTAL",
        "ABONADO",
        "PENDIENTE",
        "CANT. ABONOS",
      ],
    ];
    XLSX.utils.sheet_add_aoa(wsDetalle, detalleHeaders, { origin: "A1" });

    // Estilos headers
    ["A1", "B1", "C1", "D1", "E1", "F1", "G1", "H1"].forEach((cell) => {
      if (wsDetalle[cell]) wsDetalle[cell].s = excelStyles.tablaHeader;
    });

    // Data rows
    const detalleRows = data.map((item, index) => {
      const total = toNumber(item.reporte__total_reporte);
      const abonado = toNumber(item.total_abonado);
      const pendiente = total - abonado;
      return [
        index + 1,
        item.reporte__n_presupuesto,
        item.reporte__cliente__nombre || "—",
        item.reporte__descripcion || "—",
        total,
        abonado,
        pendiente,
        item.cantidad_abonos,
      ];
    });

    XLSX.utils.sheet_add_aoa(wsDetalle, detalleRows, { origin: "A2" });

    // Estilo celdas данных
    for (let row = 2; row <= data.length + 1; row++) {
      ["A", "B", "C", "D", "H"].forEach((col) => {
        const cell = `${col}${row}`;
        if (wsDetalle[cell]) wsDetalle[cell].s = excelStyles.tablaCelda;
      });
      ["E", "F", "G"].forEach((col) => {
        const cell = `${col}${row}`;
        if (wsDetalle[cell]) {
          wsDetalle[cell].s = {
            ...excelStyles.tablaCelda,
            numFmt: "$#,##0.00",
          };
        }
      });
    }

    // Anchos de columna
    wsDetalle["!cols"] = [
      { wch: 5 },
      { wch: 15 },
      { wch: 25 },
      { wch: 30 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 12 },
    ];

    XLSX.utils.book_append_sheet(wb, wsDetalle, "DETALLE");

    // Generar archivo
    const fileName = `Cuentas_${fechaDesde || "Completo"}_${fechaHasta || "Completo"}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  return { generarExcelCuentas };
}