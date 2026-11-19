import * as XLSX from "xlsx-js-style";
import logo from "../../../assets/img/Logotipo.png?inline";

const drawingNamespace = "http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing";
const drawingMain = "http://schemas.openxmlformats.org/drawingml/2006/main";
const officeRelationships = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const packageRelationships = "http://schemas.openxmlformats.org/package/2006/relationships";
const drawingContentType = "application/vnd.openxmlformats-officedocument.drawing+xml";
const xmlHeader = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';

const relationship = (type, target) => `${xmlHeader}
<Relationships xmlns="${packageRelationships}">
  <Relationship Id="rId1" Type="${officeRelationships}/${type}" Target="${target}"/>
</Relationships>`;

// DrawingML mide en EMU, con 9.525 EMU por píxel a 96 dpi.
const emu = (pixels) => pixels * 9525;
const drawing = `${xmlHeader}
<xdr:wsDr xmlns:xdr="${drawingNamespace}" xmlns:a="${drawingMain}" xmlns:r="${officeRelationships}">
  <xdr:oneCellAnchor>
    <xdr:from>
      <xdr:col>0</xdr:col><xdr:colOff>${emu(14)}</xdr:colOff>
      <xdr:row>1</xdr:row><xdr:rowOff>${emu(4)}</xdr:rowOff>
    </xdr:from>
    <xdr:ext cx="${emu(88)}" cy="${emu(57)}"/>
    <xdr:pic>
      <xdr:nvPicPr>
        <xdr:cNvPr id="1" name="Logotipo HERMABE"/>
        <xdr:cNvPicPr><a:picLocks noChangeAspect="1"/></xdr:cNvPicPr>
      </xdr:nvPicPr>
      <xdr:blipFill>
        <a:blip r:embed="rId1"/>
        <a:stretch><a:fillRect/></a:stretch>
      </xdr:blipFill>
      <xdr:spPr><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr>
    </xdr:pic>
    <xdr:clientData/>
  </xdr:oneCellAnchor>
</xdr:wsDr>`;

export function guardarPresupuestoExcel(workbook, filename) {
  // xlsx-js-style conserva estilos y fórmulas, pero su escritor no admite imágenes.
  const bytes = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
  const { CFB } = XLSX;
  const zip = CFB.read(new Uint8Array(bytes), { type: "array" });
  const encode = new TextEncoder();
  const decode = new TextDecoder();
  const addXml = (path, content) => CFB.utils.cfb_add(zip, path, encode.encode(content));
  const updateXml = (path, update) => {
    const part = CFB.find(zip, `/${path}`);
    part.content = encode.encode(update(decode.decode(part.content)));
    part.size = part.content.length;
  };

  const png = Uint8Array.from(atob(logo.split(",", 2)[1]), (character) => character.charCodeAt(0));
  CFB.utils.cfb_add(zip, "xl/media/logotipo-hermabe.png", png);

  const drawingTypes = [];
  workbook.SheetNames.forEach((_, index) => {
    const id = index + 1;
    const sheetPath = `xl/worksheets/sheet${id}.xml`;
    const drawingPath = `xl/drawings/drawing${id}.xml`;

    // xlsx-js-style no escribe el ajuste de impresión. La altura 0 deja que Excel pagine por filas.
    updateXml(sheetPath, (xml) => xml
      .replace(/<worksheet\b[^>]*>/, '$&<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>')
      .replace(/<ignoredErrors>|<\/worksheet>/, '<pageSetup orientation="portrait" fitToWidth="1" fitToHeight="0"/>$&')
      .replace("</worksheet>", `<drawing xmlns:r="${officeRelationships}" r:id="rId1"/></worksheet>`));
    addXml(`xl/worksheets/_rels/sheet${id}.xml.rels`, relationship("drawing", `../drawings/drawing${id}.xml`));
    addXml(drawingPath, drawing);
    addXml(`xl/drawings/_rels/drawing${id}.xml.rels`, relationship("image", "../media/logotipo-hermabe.png"));
    drawingTypes.push(`<Override PartName="/${drawingPath}" ContentType="${drawingContentType}"/>`);
  });

  updateXml("[Content_Types].xml", (xml) => {
    const pngType = xml.includes('Extension="png"') ? "" : '<Default Extension="png" ContentType="image/png"/>';
    return xml.replace("</Types>", `${pngType}${drawingTypes.join("")}</Types>`);
  });

  const archive = CFB.write(zip, { fileType: "zip", type: "array", compression: true });
  const url = URL.createObjectURL(new Blob([archive], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
