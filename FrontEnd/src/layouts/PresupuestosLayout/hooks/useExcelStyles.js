// src/hooks/useExcelStyles.js

export const excelStyles = {
  empresaTitulo: {
    font: { bold: true, sz: 14, color: { rgb: "000000" } },
    alignment: { horizontal: "left" },
  },
  empresaSubtitulo: {
    font: { bold: true, sz: 10 },
    alignment: { horizontal: "left" },
  },
  empresaDireccion: {
    font: { color: { rgb: "C00000" }, bold: true },
    alignment: { horizontal: "left" },
  },
  tituloPrincipal: {
    font: { bold: true, sz: 14, color: { rgb: "FFFFFF" } },
    alignment: { horizontal: "center" },
    fill: { fgColor: { rgb: "305496" } },
  },
  subtitulo: {
    font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } },
    alignment: { horizontal: "center" },
    fill: { fgColor: { rgb: "4472C4" } },
  },
  tablaHeader: {
    font: { bold: true },
    alignment: { horizontal: "center" },
    fill: { fgColor: { rgb: "D9E1F2" } },
    border: {
      top: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
      bottom: { style: "thin" },
    },
  },
  tablaCelda: {
    alignment: { horizontal: "center" },
    border: {
      top: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
      bottom: { style: "thin" },
    },
  },
  resumenLabel: {
    font: { bold: true },
    alignment: { horizontal: "left" },
  },
  resumenValue: {
    numFmt: "$#,##0.00",
    alignment: { horizontal: "right" },
  },
  seccionTitulo: {
    font: { bold: true, sz: 11 },
    alignment: { horizontal: "center" },
    fill: { fgColor: { rgb: "BDD7EE" } },
    border: {
      top: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
      bottom: { style: "thin" },
    },
  },
};

export const columnWidths = [
  { wch: 12 },
  { wch: 40 },
  { wch: 10 },
  { wch: 12 },
  { wch: 14 },
  { wch: 14 },
  { wch: 16 }, // nueva columna (observaciones / % desp)
];
