// src/hooks/useExcelGenerator.js
import * as XLSX from "xlsx-js-style";
import { excelStyles, columnWidths } from "./useExcelStyles";
import { usePresupuesto } from "../../../context/PresupuestoContext";

export default function useExcelGenerator() {
    const { formData } = usePresupuesto();

    const generarExcelAPUs = (otro, nPresupuesto) => {
        if (!formData?.apus?.length) return;

        const wb = XLSX.utils.book_new();

        /* =========================
           HOJA 1: RESUMEN (como PDF)
        ========================= */
        const wsResumen = XLSX.utils.aoa_to_sheet([]);

        const clienteNombre = formData?.cliente?.nombre?.toUpperCase() || "—";
        const clienteRif = formData?.cliente?.rif ? `, ${formData.cliente.rif}` : "";
        const clienteTexto = `${clienteNombre}${clienteRif}`;
        const descripcion = formData?.descripcion?.toUpperCase() || "—";
        const total = formData?.presupuesto_estimado || 0;

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
                ["PRESUPUESTO"],
                [],
                ["CLIENTE:", clienteTexto, "", "", "ORDEN DE SERVICIO", "N° PRESUPUESTO", String(nPresupuesto || "----")],
                [],
                [descripcion],
                [],
            ],
            { origin: "A1" }
        );

        // Estilos básicos del encabezado
        if (wsResumen["A1"]) wsResumen["A1"].s = excelStyles.empresaTitulo;
        if (wsResumen["A2"]) wsResumen["A2"].s = excelStyles.tituloPrincipal;
        if (wsResumen["A3"]) wsResumen["A3"].s = excelStyles.empresaSubtitulo;
        if (wsResumen["A4"]) wsResumen["A4"].s = excelStyles.empresaDireccion;
        if (wsResumen["A5"]) wsResumen["A5"].s = excelStyles.empresaDireccion;
        if (wsResumen["A7"]) wsResumen["A7"].s = excelStyles.tituloPrincipal;
        if (wsResumen["A9"]) wsResumen["A9"].s = excelStyles.resumenLabel;
        if (wsResumen["B9"]) wsResumen["B9"].s = excelStyles.resumenValue;
        if (wsResumen["E9"]) wsResumen["E9"].s = excelStyles.resumenLabel;
        if (wsResumen["F9"]) wsResumen["F9"].s = excelStyles.resumenLabel;
        if (wsResumen["G9"]) wsResumen["G9"].s = excelStyles.resumenValue;
        if (wsResumen["A11"]) wsResumen["A11"].s = excelStyles.subtitulo;

        // Tabla de APUs
        const resumenHeaders = [["N°", "DESCRIPCIÓN", "UND.", "CANT.", "PRECIO UNIT.", "PRECIO TOTAL"]];
        XLSX.utils.sheet_add_aoa(wsResumen, resumenHeaders, { origin: "A13" });

        ["A", "B", "C", "D", "E", "F"].forEach((col) => {
            if (wsResumen[`${col}13`]) wsResumen[`${col}13`].s = excelStyles.tablaHeader;
        });

        const rows = (formData?.apus || []).map((apu, index) => {
            const cantidad = apu.body?.cantidad || 1;
            const presupuestoBase = apu.body?.presupuesto_base || 0;

            return [
                index + 1,
                apu.body?.descripcion || "—",
                apu.body?.unidad || "UND",
                cantidad,
                presupuestoBase / cantidad,
                presupuestoBase,
            ];
        });

        let filaResumen = 14;

        rows.forEach((row) => {
            XLSX.utils.sheet_add_aoa(wsResumen, [row], { origin: `A${filaResumen}` });

            ["A", "B", "C", "D", "E", "F"].forEach((col) => {
                if (wsResumen[`${col}${filaResumen}`]) {
                    wsResumen[`${col}${filaResumen}`].s = excelStyles.tablaCelda;
                }
            });

            filaResumen++;
        });

        // Totales
        XLSX.utils.sheet_add_aoa(
            wsResumen,
            [
                [],
                ["", "", "", "", "SUB-TOTAL:", total],
                ["", "", "", "", "TOTAL:", total],
                [],
                ["ELABORADO POR:", "ING. CESAR BECERRA CIV N° 309740"],
                ["FECHA:", new Date().toLocaleDateString()],
                ["VALIDEZ DE LA OFERTA:", "5 DÍAS"],
                ["FORMA DE PAGO:", "60% ANTICIPO  40% A SU ENTREGA"],
                [],
                [
                    "LOS PRECIOS NO INCLUYEN IVA; LO QUE NO SE ENCUENTRE EN EL PRESENTE PRESUPUESTO SERÁ PRESUPUESTADO POR APARTE."
                ],
            ],
            { origin: `A${filaResumen}` }
        );

        // Estilos para totales y pie
        const subTotalRow = filaResumen + 1;
        const totalRow = filaResumen + 2;

        if (wsResumen[`E${subTotalRow}`]) wsResumen[`E${subTotalRow}`].s = excelStyles.resumenLabel;
        if (wsResumen[`F${subTotalRow}`]) wsResumen[`F${subTotalRow}`].s = excelStyles.resumenValue;
        if (wsResumen[`E${totalRow}`]) wsResumen[`E${totalRow}`].s = excelStyles.resumenLabel;
        if (wsResumen[`F${totalRow}`]) wsResumen[`F${totalRow}`].s = excelStyles.resumenValue;

        wsResumen["!cols"] = [
            { wch: 8 },   // A
            { wch: 55 },  // B
            { wch: 10 },  // C
            { wch: 10 },  // D
            { wch: 15 },  // E
            { wch: 18 },  // F
            { wch: 15 },  // G
        ];

        // Combinar celdas para que se vea más parecido al PDF
        wsResumen["!merges"] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },   // A1:F1
            { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },   // A2:F2
            { s: { r: 2, c: 0 }, e: { r: 2, c: 5 } },   // A3:F3
            { s: { r: 3, c: 0 }, e: { r: 3, c: 5 } },   // A4:F4
            { s: { r: 4, c: 0 }, e: { r: 4, c: 5 } },   // A5:F5
            { s: { r: 6, c: 0 }, e: { r: 6, c: 5 } },   // A7:F7
            { s: { r: 8, c: 1 }, e: { r: 8, c: 3 } },   // B9:D9
            { s: { r: 8, c: 4 }, e: { r: 8, c: 4 } },   // E9
            { s: { r: 10, c: 0 }, e: { r: 10, c: 5 } }, // A11:F11
            { s: { r: filaResumen + 8, c: 0 }, e: { r: filaResumen + 8, c: 5 } }, // aviso final
        ];

        XLSX.utils.book_append_sheet(wb, wsResumen, "RESUMEN");

        /* =========================
           HOJAS APU
        ========================= */
        formData.apus.forEach((apu, index) => {
            const ws = XLSX.utils.aoa_to_sheet([]);
            const hojaNombre = apu.body?.descripcion?.substring(0, 28) || `APU_${index + 1}`;

            XLSX.utils.sheet_add_aoa(
                ws,
                [
                    ["S.T.I. HERMABE"],
                    ["RIF V-14368387-3"],
                    ["Carrera 7 N° 12-81, San Vicente, telfs. 0277-2912496; 0424-7188106"],
                    ["San Juan de Colón, Estado Táchira"],
                    [],
                    ["ANÁLISIS DE PRECIOS UNITARIOS"],
                    [apu.body?.descripcion?.toUpperCase() || "SIN DESCRIPCIÓN"],
                ],
                { origin: "A1" }
            );

            ws["A1"].s = excelStyles.empresaTitulo;
            ws["A2"].s = excelStyles.empresaSubtitulo;
            ws["A3"].s = excelStyles.empresaDireccion;
            ws["A6"].s = excelStyles.tituloPrincipal;
            ws["A7"].s = excelStyles.subtitulo;

            let currentRow = 9;

            const rendimiento = apu.body?.rendimiento || 1;
            const unidad = apu.body?.unidad || "UND";
            const cantidad = apu.body?.cantidad || 1;

            XLSX.utils.sheet_add_aoa(
                ws,
                [["RENDIMIENTO", rendimiento, "UNIDAD", unidad, "CANTIDAD", cantidad]],
                { origin: `A${currentRow}` }
            );
            currentRow += 2;

            const agregarTabla = (titulo, headers, data) => {
                XLSX.utils.sheet_add_aoa(ws, [[titulo]], { origin: `A${currentRow}` });
                ws[`A${currentRow}`].s = excelStyles.seccionTitulo;
                currentRow++;

                XLSX.utils.sheet_add_aoa(ws, [headers], { origin: `A${currentRow}` });
                ["A", "B", "C", "D", "E", "F", "G"].forEach((col) => {
                    if (ws[`${col}${currentRow}`]) ws[`${col}${currentRow}`].s = excelStyles.tablaHeader;
                });
                currentRow++;

                const startRow = currentRow;

                if (!data || data.length === 0) {
                    XLSX.utils.sheet_add_aoa(ws, [["", "", "", 0, 0, 0, 0]], {
                        origin: `A${currentRow}`,
                    });
                    ["A", "B", "C", "D", "E", "F", "G"].forEach((col) => {
                        if (ws[`${col}${currentRow}`]) ws[`${col}${currentRow}`].s = excelStyles.tablaCelda;
                    });
                    currentRow++;
                } else {
                    data.forEach((item) => {
                        XLSX.utils.sheet_add_aoa(
                            ws,
                            [[
                                item.codigo || "",
                                item.descripcion || "",
                                item.unidad || "",
                                item.cantidad || 0,
                                item.desp || 0,
                                item.costo || item.precio_unitario || 0,
                                null,
                            ]],
                            { origin: `A${currentRow}` }
                        );

                        ws[`G${currentRow}`] = {
                            f: `=D${currentRow}*(1+E${currentRow}/100)*F${currentRow}`,
                        };

                        ["A", "B", "C", "D", "E", "F", "G"].forEach((col) => {
                            if (ws[`${col}${currentRow}`]) ws[`${col}${currentRow}`].s = excelStyles.tablaCelda;
                        });
                        currentRow++;
                    });
                }

                XLSX.utils.sheet_add_aoa(ws, [["", "", "", "", "", "TOTAL", null]], {
                    origin: `A${currentRow}`,
                });

                const totalFormula = `IFERROR(SUM(G${startRow}:G${currentRow - 1}),0)`;

                ws[`G${currentRow}`] = titulo.toUpperCase().includes("COSTO DE HERRAMIENTAS")
                    ? { f: `=IF(B9<>0, ${totalFormula}, 0)` }
                    : { f: `=${totalFormula}` };

                ws[`E${currentRow}`].s = excelStyles.resumenLabel;
                ws[`F${currentRow}`].s = excelStyles.resumenValue;

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
                ["CÓDIGO", "DESCRIPCIÓN", "UNIDAD", "CANTIDAD", "% DESP", "PRECIO UNITARIO", "TOTAL"],
                materiales
            );
            const totalHerrRow = agregarTabla(
                "COSTO DE HERRAMIENTAS",
                ["CÓDIGO", "DESCRIPCIÓN", "UNIDAD", "CANTIDAD", "", "COSTO", "TOTAL"],
                herramientas
            );
            const totalMoRow = agregarTabla(
                "MANO DE OBRA",
                ["CÓDIGO", "DESCRIPCIÓN", "UNIDAD", "CANTIDAD", "", "PRECIO UNITARIO", "TOTAL"],
                mano_obra
            );
            const totalLogRow = agregarTabla(
                "LOGÍSTICA",
                ["CÓDIGO", "DESCRIPCIÓN", "UNIDAD", "CANTIDAD", "", "PRECIO UNITARIO", "TOTAL"],
                logistica
            );

            const resumenStart = currentRow;
            const row = resumenStart;
            const safe = (v) => (v ? v : 0);

            XLSX.utils.sheet_add_aoa(
                ws,
                [
                    ["TOTAL MATERIALES", { f: `IFERROR(G${safe(totalMatRow) - 1},0)` }],
                    ["TOTAL HERRAMIENTAS", { f: `IFERROR(G${safe(totalHerrRow) - 1}/B9,0)` }],
                    ["TOTAL MANO DE OBRA BASE", { f: `IFERROR(G${safe(totalMoRow) - 1}+G${safe(totalLogRow) - 1},0)` }],
                    ["BONO ALIMENTICIO ($15 × Días)", { f: `IFERROR(SUM(D${safe((totalMoRow - 1) - mano_obra.length)}:D${safe(totalMoRow - 1)})*15,0)` }],
                    ["PRESTACIONES SOCIALES (200%)", { f: `IFERROR(F${safe(row) + 2}*2,0)` }],
                    ["TOTAL MANO DE OBRA", { f: `IFERROR(F${safe(row) + 2}+F${safe(row) + 3}+F${safe(row) + 4},0)` }],
                    ["COSTO POR UNIDAD", { f: `IFERROR(F${safe(row) + 5}/B9,0)` }],
                    ["COSTO DIRECTO POR UNIDAD", { f: `IFERROR(F${safe(row)}+F${safe(row) + 1}+F${safe(row) + 6},0)` }],
                    ["15% ADMINISTRACIÓN Y GASTOS", { f: `IFERROR(F${safe(row) + 7}*0.15,0)` }],
                    ["SUBTOTAL", { f: `IFERROR(F${safe(row) + 7}+F${safe(row) + 8},0)` }],
                    ["15% UTILIDAD", { f: `IFERROR(F${safe(row) + 9}*0.15,0)` }],
                    ["TOTAL UNITARIO", { f: `IFERROR(F${safe(row) + 9}+F${safe(row) + 10},0)` }],
                ],
                { origin: `E${resumenStart}` }
            );

            for (let i = 0; i < 14; i++) {
                const c1 = `E${resumenStart + i}`;
                const c2 = `F${resumenStart + i}`;
                if (ws[c1]) ws[c1].s = excelStyles.resumenLabel;
                if (ws[c2]) ws[c2].s = excelStyles.resumenValue;
            }

            ws["!cols"] = columnWidths;
            XLSX.utils.book_append_sheet(wb, ws, hojaNombre);
        });

        XLSX.writeFile(
            wb,
            `${nPresupuesto}_${formData?.descripcion}_${formData?.cliente?.nombre || ""}_${new Date()
                .toISOString()
                .split("T")[0]}.xlsx`
        );
    };

    return { generarExcelAPUs };
}