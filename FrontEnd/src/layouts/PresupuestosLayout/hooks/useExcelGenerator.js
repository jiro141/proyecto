// src/hooks/useExcelGenerator.js
import * as XLSX from "xlsx-js-style";
import { excelStyles, columnWidths } from "./useExcelStyles";
import { usePresupuesto } from "../../../context/PresupuestoContext";
export default function useExcelGenerator() {
    const { formData } = usePresupuesto();

    const generarExcelAPUs = (otro,nPresupuesto) => {
        if (!formData?.apus?.length) return;

        const wb = XLSX.utils.book_new();

        formData.apus.forEach((apu, index) => {
            const ws = XLSX.utils.aoa_to_sheet([]);
            const hojaNombre = apu.body?.descripcion?.substring(0, 28) || `APU_${index + 1}`;

            // === ENCABEZADO EMPRESA ===
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

            // === INFO GENERAL ===
            const rendimiento = apu.body?.rendimiento || 1;
            const unidad = apu.body?.unidad || "UND";
            const cantidad = apu.body?.cantidad || 1;
            const porcentaje_desp = apu.body?.depreciacion || apu.body?.porcentaje_desp || 0;
            const presupuesto_base = apu.body?.presupuesto_base || 0;

            XLSX.utils.sheet_add_aoa(
                ws,
                [["RENDIMIENTO", rendimiento, "UNIDAD", unidad, "CANTIDAD", cantidad]],
                { origin: `A${currentRow}` }
            );
            currentRow += 2;

            // === FUNCIÓN DE TABLAS ===
            const agregarTabla = (titulo, headers, data) => {
                // título
                XLSX.utils.sheet_add_aoa(ws, [[titulo]], { origin: `A${currentRow}` });
                ws[`A${currentRow}`].s = excelStyles.seccionTitulo;
                currentRow++;

                // encabezados
                XLSX.utils.sheet_add_aoa(ws, [headers], { origin: `A${currentRow}` });
                ["A", "B", "C", "D", "E", "F", "G"].forEach(
                    (col) => (ws[`${col}${currentRow}`].s = excelStyles.tablaHeader)
                );
                currentRow++;

                const startRow = currentRow;

                // si no hay datos, crear una fila vacía con ceros
                if (!data || data.length === 0) {
                    XLSX.utils.sheet_add_aoa(
                        ws,
                        [["", "", "", 0, 0, 0, 0]],
                        { origin: `A${currentRow}` }
                    );
                    ["A", "B", "C", "D", "E", "F", "G"].forEach(
                        (col) => (ws[`${col}${currentRow}`].s = excelStyles.tablaCelda)
                    );
                    currentRow++;
                } else {
                    // agregar cada fila con sus fórmulas
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
                                null, // columna TOTAL
                            ]],
                            { origin: `A${currentRow}` }
                        );

                        // fórmula del total de fila
                        ws[`G${currentRow}`] = { f: `=D${currentRow}*(1+E${currentRow}/100)*F${currentRow}` };

                        ["A", "B", "C", "D", "E", "F", "G"].forEach(
                            (col) => (ws[`${col}${currentRow}`].s = excelStyles.tablaCelda)
                        );
                        currentRow++;
                    });
                }

                // === Fila TOTAL siempre presente ===
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

                // devuelve la fila del TOTAL (siempre válida)
                return currentRow - 1;
            };

            // === SECCIONES ===
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

            // === RESUMEN FINAL ===
            const resumenStart = currentRow;
            const row = resumenStart;
            const safe = v => (v ? v : 0);
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



            // === APLICAR ESTILOS ===
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
