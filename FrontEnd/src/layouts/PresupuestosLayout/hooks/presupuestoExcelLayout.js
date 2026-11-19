import * as XLSX from "xlsx-js-style";
import { EMPRESA } from "../../../pdf/empresa";

const azul = "0B2C4D";
const rojo = "E30613";
const gris = "E6E6E6";
const bordeFino = { style: "thin", color: { rgb: "CFD5DB" } };
const bordeTabla = {
  top: bordeFino,
  left: bordeFino,
  right: bordeFino,
  bottom: bordeFino,
};
const centrado = { horizontal: "center", vertical: "center", wrapText: true };
const izquierda = { ...centrado, horizontal: "left" };
const derecha = { horizontal: "right", vertical: "center" };

export const excelStyles = {
  empresaTitulo: {
    font: { bold: true, sz: 12 },
    alignment: izquierda,
  },
  empresaSubtitulo: {
    font: { bold: true, sz: 14, color: { rgb: azul } },
    alignment: izquierda,
  },
  empresaDireccion: {
    font: { sz: 10 },
    alignment: izquierda,
  },
  tituloPrincipal: {
    font: { bold: true, sz: 14, color: { rgb: "FFFFFF" } },
    alignment: centrado,
    fill: { fgColor: { rgb: azul } },
  },
  subtitulo: {
    font: { bold: true, sz: 11, color: { rgb: azul } },
    alignment: centrado,
    fill: { fgColor: { rgb: "E9EFF5" } },
  },
  tablaHeader: {
    font: { bold: true },
    alignment: centrado,
    fill: { fgColor: { rgb: gris } },
    border: bordeTabla,
  },
  tablaCelda: {
    alignment: centrado,
    border: bordeTabla,
  },
  tablaDescripcion: {
    alignment: izquierda,
    border: bordeTabla,
  },
  tablaMonto: {
    numFmt: "$#,##0.00",
    alignment: derecha,
    border: bordeTabla,
  },
  resumenLabel: {
    font: { bold: true },
    alignment: izquierda,
  },
  referenciaLabel: {
    font: { bold: true, sz: 10, color: { rgb: rojo } },
    alignment: centrado,
  },
  referenciaValue: {
    font: { bold: true, sz: 12, color: { rgb: rojo } },
    alignment: centrado,
  },
  texto: {
    alignment: izquierda,
  },
  resumenValue: {
    numFmt: "$#,##0.00",
    alignment: derecha,
  },
  seccionTitulo: {
    font: { bold: true, sz: 11, color: { rgb: azul } },
    alignment: centrado,
    fill: { fgColor: { rgb: "DCE6F1" } },
  },
};

export const columnWidths = [16, 60, 12, 15, 13, 18, 18].map((wch) => ({ wch }));

export const resumenColumnWidths = [16, 60, 12, 12, 18, 19].map((wch) => ({ wch }));


export function combinar(ws, range, value, style) {
  const merge = XLSX.utils.decode_range(range);
  (ws["!merges"] ??= []).push(merge);

  for (let row = merge.s.r; row <= merge.e.r; row++) {
    for (let col = merge.s.c; col <= merge.e.c; col++) {
      const anchor = row === merge.s.r && col === merge.s.c;
      const address = XLSX.utils.encode_cell({ r: row, c: col });
      XLSX.utils.sheet_add_aoa(ws, [[anchor ? value : ""]], { origin: address });
      ws[address].s = style;
    }
  }
}

export function ajustarAlto(ws, row, texts, minHeight = 18) {
  let height = minHeight;

  for (const { value, columns, fontSize = 11, bold = false } of texts) {
    const width = columns.reduce((sum, col) => sum + ws["!cols"][col].wch * 7, 0) - 8;
    const fontPixels = (fontSize * 4) / 3;
    const measure = (text) => Array.from(text).reduce((sum, character) => {
      const factor = /[MWÁÉÓ@%]/.test(character) ? 0.9
        : /[iIl.,' :;]/.test(character) ? 0.36 : 0.65;
      return sum + factor * fontPixels * (bold ? 1.08 : 1);
    }, 0);

    let lines = 0;
    for (const paragraph of String(value ?? "").split(/\r\n?|\n/)) {
      lines++;
      let occupied = 0;
      for (const word of paragraph.split(/\s+/).filter(Boolean)) {
        const wordWidth = measure(word);
        const spaceWidth = occupied ? measure(" ") : 0;
        if (occupied && occupied + spaceWidth + wordWidth > width) {
          lines++;
          occupied = 0;
        }

        const nextWidth = occupied + (occupied ? spaceWidth : 0) + wordWidth;
        // Una palabra más larga que la celda también se parte en Excel.
        const extraLines = Math.max(0, Math.ceil(nextWidth / width) - 1);
        lines += extraLines;
        occupied = nextWidth - extraLines * width;
      }
    }

    height = Math.max(height, lines * Math.ceil(fontSize * 1.35) + 4);
  }

  // Excel no ajusta automáticamente el alto de una fila con celdas combinadas.
  (ws["!rows"] ??= [])[row - 1] = { hpt: Math.min(409, height) };
}

export function agregarMembrete(ws, lastColumn) {
  combinar(ws, "A1:A5", "", excelStyles.texto);

  const lines = [
    [EMPRESA.titular, excelStyles.empresaTitulo, 18],
    [EMPRESA.nombre, excelStyles.empresaSubtitulo, 22],
    [`RIF: ${EMPRESA.rif}`, excelStyles.empresaDireccion, 15],
    [EMPRESA.direccion, excelStyles.empresaDireccion, 15],
    [`Telfs: ${EMPRESA.telefonos}`, excelStyles.empresaDireccion, 15],
  ];

  lines.forEach(([value, style, height], i) => {
    const row = i + 1;
    combinar(ws, `B${row}:${lastColumn}${row}`, value, style);
    ajustarAlto(ws, row, [], height);
  });
}
