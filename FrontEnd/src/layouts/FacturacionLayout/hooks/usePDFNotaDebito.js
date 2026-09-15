import jsPDF from "jspdf";

import logo from "../../../assets/img/Logotipo.png";
import sello from "../../../assets/img/sello.png";

/* =========================================================
   NOTA DE DÉBITO
   MEDIA HOJA LETTER
   215.9 mm x 139.7 mm
   ========================================================= */

const PAGE_W = 215.9;
const PAGE_H = 139.7;

const X = 5;
const W = PAGE_W - X * 2;

const AZUL = [48, 66, 122];
const ROJO = [155, 73, 67];
const BLANCO = [255, 255, 255];

const ITEM_ROWS = 6;

/* =========================================================
   EMPRESA
   ========================================================= */

const EMPRESA = {
  nombre: "Cesar Augusto Becerra Ramirez",

  razon:
    "SERVICIOS TÉCNICOS INDUSTRIALES (S.T.I. HERMABE)",

  rif: "V143683873",

  domicilio1:
    "Domicilio Fiscal: Carrera 7 Casa Nro. 12-81 Sector Barrio San Vicente Colón",

  domicilio2:
    "Colón Estado Táchira / Zona Postal 5003",

  telefono1: "0277 - 291 24 96",
  telefono2: "0424 - 718 81 06",
  telefono3: "0426 - 062 32 46",

  email: "stihermabe19@gmail.com",
};

/* =========================================================
   HELPERS
   ========================================================= */

const primerValor = (...values) => {
  for (const value of values) {
    if (
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
    ) {
      return value;
    }
  }

  return "";
};

const convertirNumero = (value) => {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return 0;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  let str = String(value)
    .trim()
    .replace(/[^\d,.-]/g, "");

  if (!str) {
    return 0;
  }

  // 1.234,56
  if (
    str.includes(".") &&
    str.includes(",") &&
    str.lastIndexOf(",") > str.lastIndexOf(".")
  ) {
    str = str.replace(/\./g, "").replace(",", ".");
  }

  // 1,234.56
  else if (
    str.includes(".") &&
    str.includes(",")
  ) {
    str = str.replace(/,/g, "");
  }

  // 1234,56
  else if (str.includes(",")) {
    str = str.replace(",", ".");
  }

  const numero = Number(str);

  return Number.isFinite(numero) ? numero : 0;
};

const formatNumero = (value) =>
  convertirNumero(value).toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatCantidad = (value) => {
  const numero = convertirNumero(value);

  return Number.isInteger(numero)
    ? String(numero)
    : numero.toFixed(2);
};

const sanitizarParte = (parte) =>
  String(parte || "")
    .replace(/[\\/:*?"<>|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/* =========================================================
   MONEDA
   ========================================================= */

const normalizarMoneda = (moneda) => {
  const value = String(moneda || "BS")
    .trim()
    .toUpperCase();

  if (
    value === "VES" ||
    value === "BS" ||
    value === "BS." ||
    value === "BOLIVAR" ||
    value === "BOLIVARES"
  ) {
    return "BS";
  }

  if (
    value === "USD" ||
    value === "$"
  ) {
    return "USD";
  }

  return value;
};

/* =========================================================
   BÚSQUEDA FLEXIBLE
   ========================================================= */

const normalizarClave = (clave) =>
  String(clave || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

const buscarValorEnObjeto = (
  objeto,
  candidatos = [],
  profundidad = 0,
  maxProfundidad = 3
) => {
  if (
    !objeto ||
    typeof objeto !== "object"
  ) {
    return "";
  }

  const candidatosNormalizados =
    candidatos.map(normalizarClave);

  for (const [key, value] of Object.entries(objeto)) {
    const keyNormalizada =
      normalizarClave(key);

    if (
      candidatosNormalizados.includes(keyNormalizada) &&
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      return value;
    }
  }

  if (profundidad < maxProfundidad) {
    for (const value of Object.values(objeto)) {
      if (
        value &&
        typeof value === "object" &&
        !Array.isArray(value)
      ) {
        const encontrado =
          buscarValorEnObjeto(
            value,
            candidatos,
            profundidad + 1,
            maxProfundidad
          );

        if (
          encontrado !== undefined &&
          encontrado !== null &&
          encontrado !== ""
        ) {
          return encontrado;
        }
      }
    }
  }

  return "";
};

const buscarEnFuentes = (
  fuentes,
  candidatos
) => {
  for (const fuente of fuentes) {
    const encontrado =
      buscarValorEnObjeto(
        fuente,
        candidatos
      );

    if (
      encontrado !== undefined &&
      encontrado !== null &&
      encontrado !== ""
    ) {
      return encontrado;
    }
  }

  return "";
};

/* =========================================================
   FECHAS
   ========================================================= */

const obtenerPartesFecha = (value) => {
  if (!value) {
    return {
      dia: "",
      mes: "",
      anio: "",
    };
  }

  const raw = String(value);

  const yyyyMmDd = raw.match(
    /^(\d{4})-(\d{2})-(\d{2})/
  );

  if (yyyyMmDd) {
    return {
      dia: yyyyMmDd[3],
      mes: yyyyMmDd[2],
      anio: yyyyMmDd[1],
    };
  }

  const ddMmYyyy = raw.match(
    /^(\d{2})[/-](\d{2})[/-](\d{4})/
  );

  if (ddMmYyyy) {
    return {
      dia: ddMmYyyy[1],
      mes: ddMmYyyy[2],
      anio: ddMmYyyy[3],
    };
  }

  const date = new Date(value);

  if (!Number.isNaN(date.getTime())) {
    return {
      dia: String(date.getDate()).padStart(2, "0"),

      mes: String(
        date.getMonth() + 1
      ).padStart(2, "0"),

      anio: String(
        date.getFullYear()
      ),
    };
  }

  return {
    dia: "",
    mes: "",
    anio: "",
  };
};

const formatearFecha = (value) => {
  const fecha =
    obtenerPartesFecha(value);

  if (!fecha.anio) {
    return "";
  }

  return `${fecha.dia}/${fecha.mes}/${fecha.anio}`;
};

/* =========================================================
   RESOLVER DATOS DE FACTURA
   ========================================================= */

const resolverDatosFactura = (
  nota = {},
  extra = {}
) => {
  const factura =
    nota?.factura ||
    nota?.factura_referencia ||
    nota?.facturaReferencia ||
    extra?.factura ||
    extra?.factura_referencia ||
    extra?.facturaReferencia ||
    extra?.invoice ||
    {};

  const cliente =
    factura?.cliente ||
    factura?.customer ||
    factura?.contacto ||
    nota?.cliente ||
    extra?.cliente ||
    {};

  const fuentes = [
    factura,
    cliente,
    nota,
    extra,
  ];

  /* =====================================================
     CLIENTE
     ===================================================== */

  const clienteNombre =
    primerValor(
      nota?.cliente_nombre,
      extra?.cliente_nombre,
      factura?.cliente_nombre,

      buscarEnFuentes(
        fuentes,
        [
          "cliente_nombre",
          "nombre_cliente",
          "razon_social",
          "nombre_razon_social",
          "customer_name",
          "client_name",
        ]
      ),

      cliente?.nombre,
      cliente?.name,
      cliente?.razon_social
    );

  const clienteRif =
    primerValor(
      nota?.cliente_rif,
      extra?.cliente_rif,
      factura?.cliente_rif,

      buscarEnFuentes(
        fuentes,
        [
          "cliente_rif",
          "rif_cliente",
          "rif",
          "cedula",
          "ci",
          "identificacion",
          "documento",
          "tax_id",
          "taxid",
        ]
      )
    );

  const clienteTelefono =
    primerValor(
      nota?.cliente_telefono,
      extra?.cliente_telefono,
      factura?.cliente_telefono,

      buscarEnFuentes(
        fuentes,
        [
          "cliente_telefono",
          "telefono_cliente",
          "telefono",
          "phone",
          "mobile",
          "celular",
        ]
      )
    );

  const clienteDireccion =
    primerValor(
      nota?.cliente_direccion,
      extra?.cliente_direccion,
      factura?.cliente_direccion,

      buscarEnFuentes(
        fuentes,
        [
          "cliente_direccion",
          "direccion_cliente",
          "direccion",
          "address",
          "domicilio",
        ]
      )
    );

  /* =====================================================
     FACTURA
     ===================================================== */

  const nFactura =
    primerValor(
      nota?.n_factura,
      nota?.numero_factura,
      nota?.nro_factura,

      extra?.n_factura,
      extra?.numero_factura,
      extra?.nro_factura,

      factura?.n_factura,
      factura?.numero_factura,
      factura?.nro_factura,

      buscarEnFuentes(
        [factura, extra],
        [
          "n_factura",
          "numero_factura",
          "nro_factura",
          "factura_numero",
          "invoice_number",
          "codigo_factura",
        ]
      )
    );

  const fechaFactura =
    primerValor(
      nota?.fecha_factura,
      extra?.fecha_factura,

      factura?.fecha_factura,
      factura?.fecha_emision,
      factura?.fecha_documento,
      factura?.invoice_date,

      buscarEnFuentes(
        [factura],
        [
          "fecha_factura",
          "fecha_emision",
          "fecha_documento",
          "invoice_date",
          "fecha",
          "created_at",
          "createdAt",
        ]
      )
    );

  /* =====================================================
     ORDEN DE CONTROL
     ===================================================== */

  const ordenControl =
    primerValor(
      nota?.orden_control,
      nota?.ordenControl,

      extra?.orden_control,
      extra?.ordenControl,

      factura?.orden_control,
      factura?.ordenControl,

      buscarEnFuentes(
        [factura, nota, extra],
        [
          "orden_control",
          "ordenControl",
          "ordendecontrol",
          "orden_de_control",
        ]
      )
    );

  /* =====================================================
     MONEDA FACTURA
     ===================================================== */

  const monedaFactura =
    normalizarMoneda(
      primerValor(
        factura?.moneda,
        factura?.currency,
        extra?.moneda_factura,
        nota?.moneda,
        "BS"
      )
    );

  /* =====================================================
     MONTO FACTURA
     ===================================================== */

  const montoFactura =
    convertirNumero(
      primerValor(
        nota?.monto_factura,
        extra?.monto_factura,

        factura?.monto_factura,
        factura?.monto_total,
        factura?.total_factura,
        factura?.importe_total,
        factura?.grand_total,
        factura?.total,

        buscarEnFuentes(
          [factura],
          [
            "monto_factura",
            "monto_total",
            "total_factura",
            "importe_total",
            "grand_total",
            "total_general",
            "total_pagar",
            "total",
          ]
        ),

        0
      )
    );

  /* =====================================================
     MONTO FACTURA EN BS
     ===================================================== */

  const montoFacturaBs =
    convertirNumero(
      primerValor(
        nota?.monto_factura_bs,
        extra?.monto_factura_bs,

        factura?.monto_factura_bs,
        factura?.total_bs,
        factura?.monto_bs,
        factura?.total_bolivares,
        factura?.total_ves,

        buscarEnFuentes(
          [factura],
          [
            "monto_factura_bs",
            "total_bs",
            "monto_bs",
            "total_bolivares",
            "total_ves",
            "monto_ves",
          ]
        ),

        0
      )
    );

  return {
    factura,
    cliente,

    clienteNombre,
    clienteRif,
    clienteTelefono,
    clienteDireccion,

    nFactura,
    fechaFactura,

    ordenControl,

    monedaFactura,

    montoFactura,
    montoFacturaBs,
  };
};

/* =========================================================
   ITEMS
   ========================================================= */

const resolverItemsFactura = (
  nota = {},
  factura = {}
) => {
  let itemsOriginales = [];

  if (
    Array.isArray(nota?.items) &&
    nota.items.length
  ) {
    itemsOriginales =
      nota.items;
  } else {
    itemsOriginales =
      factura?.items ||
      factura?.detalles ||
      factura?.detalle ||
      factura?.productos ||
      factura?.lineas ||
      factura?.invoice_items ||
      factura?.items_factura ||
      factura?.detalle_factura ||
      [];
  }

  if (!Array.isArray(itemsOriginales)) {
    return [];
  }

  return itemsOriginales.map(
    (item, index) => {
      const cantidad =
        convertirNumero(
          primerValor(
            item?.cantidad,

            buscarValorEnObjeto(
              item,
              [
                "cantidad",
                "qty",
                "quantity",
                "cant",
                "unidades",
              ]
            ),

            1
          )
        );

      const descripcion =
        primerValor(
          item?.apu_descripcion,
          item?.descripcion,
          item?.description,

          buscarValorEnObjeto(
            item,
            [
              "apu_descripcion",
              "descripcion",
              "description",
              "detalle",
              "producto_nombre",
              "nombre",
              "concepto",
              "servicio",
            ]
          ),

          ""
        );

      let precioUnitario =
        convertirNumero(
          primerValor(
            item?.precio_unitario,
            item?.precio,

            buscarValorEnObjeto(
              item,
              [
                "precio_unitario",
                "precioUnitario",
                "apu_precio_unitario",
                "apu_precio",
                "precio",
                "price",
                "unit_price",
                "unitPrice",
                "valor_unitario",
                "monto_unitario",
                "precio_venta",
                "pu",
                "rate",
                "unit_amount",
              ]
            ),

            0
          )
        );

      let totalItem =
        convertirNumero(
          primerValor(
            item?.total_item,

            buscarValorEnObjeto(
              item,
              [
                "total_item",
                "totalItem",
                "apu_total",
                "total",
                "monto",
                "importe",
                "subtotal",
                "line_total",
                "total_linea",
                "monto_total",
                "amount",
              ]
            ),

            0
          )
        );

      if (
        precioUnitario === 0 &&
        totalItem !== 0 &&
        cantidad !== 0
      ) {
        precioUnitario =
          totalItem /
          cantidad;
      }

      if (
        totalItem === 0 &&
        precioUnitario !== 0
      ) {
        totalItem =
          precioUnitario *
          cantidad;
      }

      return {
        index,

        cantidad,
        descripcion,

        precio_unitario:
          precioUnitario,

        total_item:
          totalItem,

        original:
          item,
      };
    }
  );
};

/* =========================================================
   NOMBRE ARCHIVO
   ========================================================= */

const generarNombreArchivo = (
  nota,
  datos
) => {
  const partes = [
    sanitizarParte(
      nota?.n_nota
    ),

    sanitizarParte(
      datos?.nFactura
    ),
  ].filter(Boolean);

  return `${
    partes.length
      ? partes.join(" ")
      : "nota-debito"
  }.pdf`;
};

/* =========================================================
   IMÁGENES
   ========================================================= */

const cargarImagenComoDataURL = async (
  src
) => {
  if (!src) {
    return null;
  }

  if (
    typeof src === "string" &&
    src.startsWith("data:image/")
  ) {
    return src;
  }

  try {
    const response =
      await fetch(src);

    if (!response.ok) {
      throw new Error(
        `No se pudo cargar la imagen: ${response.status}`
      );
    }

    const blob =
      await response.blob();

    return await new Promise(
      (resolve, reject) => {
        const reader =
          new FileReader();

        reader.onload = () =>
          resolve(
            reader.result
          );

        reader.onerror =
          reject;

        reader.readAsDataURL(
          blob
        );
      }
    );
  } catch (error) {
    console.error(
      "ERROR CARGANDO IMAGEN:",
      error
    );

    return null;
  }
};

const addImageContain = (
  doc,
  data,
  boxX,
  boxY,
  boxW,
  boxH
) => {
  if (!data) {
    return;
  }

  try {
    const props =
      doc.getImageProperties(data);

    const ratio =
      Math.min(
        boxW / props.width,
        boxH / props.height
      );

    const drawW =
      props.width *
      ratio;

    const drawH =
      props.height *
      ratio;

    const drawX =
      boxX +
      (boxW - drawW) /
        2;

    const drawY =
      boxY +
      (boxH - drawH) /
        2;

    doc.addImage(
      data,

      props.fileType ||
        "PNG",

      drawX,
      drawY,

      drawW,
      drawH,

      undefined,

      "FAST"
    );
  } catch (error) {
    console.error(
      "ERROR INSERTANDO IMAGEN:",
      error
    );
  }
};

/* =========================================================
   MAX ITEMS
   ========================================================= */

const calcularMaxItems = (
  items = []
) => ({
  maxItems:
    ITEM_ROWS,

  espacioUsado:
    Math.min(
      items.length,
      ITEM_ROWS
    ),

  espacioDisponible:
    ITEM_ROWS,

  cabenTodos:
    items.length <=
    ITEM_ROWS,
});

/* =========================================================
   DIBUJO BASE
   ========================================================= */

const colorAzul = (doc) => {
  doc.setDrawColor(
    ...AZUL
  );

  doc.setTextColor(
    ...AZUL
  );
};

const linea = (
  doc,
  x1,
  y1,
  x2,
  y2,
  width = 0.2
) => {
  doc.setLineWidth(
    width
  );

  doc.line(
    x1,
    y1,
    x2,
    y2
  );
};

const rect = (
  doc,
  x,
  y,
  w,
  h,
  radius = 0
) => {
  doc.setLineWidth(
    0.2
  );

  if (radius > 0) {
    doc.roundedRect(
      x,
      y,
      w,
      h,
      radius,
      radius
    );
  } else {
    doc.rect(
      x,
      y,
      w,
      h
    );
  }
};

const textoEnCaja = (
  doc,
  text,
  x,
  y,
  w,
  h,
  opts = {}
) => {
  const {
    fontSize = 6,
    fontStyle = "normal",
    color = AZUL,
    align = "left",
    paddingX = 1,
    maxLines = 2,
  } = opts;

  doc.setFont(
    "helvetica",
    fontStyle
  );

  doc.setFontSize(
    fontSize
  );

  doc.setTextColor(
    ...color
  );

  const usableW =
    Math.max(
      1,
      w -
        paddingX * 2
    );

  const lines =
    doc
      .splitTextToSize(
        String(
          text ?? ""
        ),
        usableW
      )
      .slice(
        0,
        maxLines
      );

  const lineH =
    fontSize *
    0.36;

  const totalH =
    lines.length *
    lineH;

  const startY =
    y +
    h / 2 -
    totalH / 2 +
    lineH *
      0.8;

  let tx =
    x +
    paddingX;

  if (
    align === "center"
  ) {
    tx =
      x +
      w / 2;
  }

  if (
    align === "right"
  ) {
    tx =
      x +
      w -
      paddingX;
  }

  lines.forEach(
    (
      ln,
      index
    ) => {
      doc.text(
        ln,
        tx,
        startY +
          index *
            lineH,
        {
          align,
        }
      );
    }
  );
};

/* =========================================================
   FECHA
   ========================================================= */

const dibujarFecha = (
  doc,
  x,
  y,
  w,
  h,
  fecha
) => {
  const labelW = 17;
  const headH = 4.2;

  const fieldsW =
    w - labelW;

  rect(
    doc,
    x,
    y,
    w,
    h,
    1
  );

  linea(
    doc,
    x +
      labelW,
    y,
    x +
      labelW,
    y + h
  );

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(
    5.5
  );

  doc.setTextColor(
    ...AZUL
  );

  doc.text(
    "FECHA DE",
    x +
      labelW / 2,
    y + 4,
    {
      align:
        "center",
    }
  );

  doc.text(
    "EMISIÓN",
    x +
      labelW / 2,
    y + 7.4,
    {
      align:
        "center",
    }
  );

  const dayW = 13;
  const monthW = 15;

  const yearW =
    fieldsW -
    dayW -
    monthW;

  const fx =
    x +
    labelW;

  doc.setFillColor(
    ...AZUL
  );

  doc.rect(
    fx,
    y,
    dayW,
    headH,
    "F"
  );

  doc.rect(
    fx +
      dayW,
    y,
    monthW,
    headH,
    "F"
  );

  doc.rect(
    fx +
      dayW +
      monthW,
    y,
    yearW,
    headH,
    "F"
  );

  doc.setTextColor(
    ...BLANCO
  );

  doc.setFontSize(
    5.2
  );

  doc.text(
    "DÍA",
    fx +
      dayW / 2,
    y + 3,
    {
      align:
        "center",
    }
  );

  doc.text(
    "MES",
    fx +
      dayW +
      monthW / 2,
    y + 3,
    {
      align:
        "center",
    }
  );

  doc.text(
    "AÑO",
    fx +
      dayW +
      monthW +
      yearW / 2,
    y + 3,
    {
      align:
        "center",
    }
  );

  colorAzul(doc);

  linea(
    doc,
    fx,
    y +
      headH,
    x + w,
    y +
      headH
  );

  linea(
    doc,
    fx +
      dayW,
    y,
    fx +
      dayW,
    y + h
  );

  linea(
    doc,
    fx +
      dayW +
      monthW,
    y,
    fx +
      dayW +
      monthW,
    y + h
  );

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(
    6.5
  );

  doc.setTextColor(
    ...AZUL
  );

  doc.text(
    fecha.dia ||
      "",
    fx +
      dayW / 2,
    y + 8.7,
    {
      align:
        "center",
    }
  );

  doc.text(
    fecha.mes ||
      "",
    fx +
      dayW +
      monthW / 2,
    y + 8.7,
    {
      align:
        "center",
    }
  );

  doc.text(
    fecha.anio ||
      "",
    fx +
      dayW +
      monthW +
      yearW / 2,
    y + 8.7,
    {
      align:
        "center",
    }
  );
};

/* =========================================================
   ENCABEZADO
   ========================================================= */

const dibujarEncabezado = async (
  doc,
  nota,
  datos
) => {
  const [
    logoData,
    selloData,
  ] =
    await Promise.all([
      cargarImagenComoDataURL(
        logo
      ),

      cargarImagenComoDataURL(
        sello
      ),
    ]);

  colorAzul(doc);

  addImageContain(
    doc,
    logoData,
    X,
    1.5,
    29,
    18
  );

  addImageContain(
    doc,
    selloData,
    PAGE_W -
      X -
      29,
    1.5,
    29,
    18
  );

  const centerX =
    PAGE_W /
    2;

  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.setFontSize(
    5.3
  );

  doc.text(
    EMPRESA.nombre,
    centerX,
    5,
    {
      align:
        "center",
    }
  );

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(
    8
  );

  doc.text(
    EMPRESA.razon,
    centerX,
    9.6,
    {
      align:
        "center",
    }
  );

  doc.setFont(
    "helvetica",
    "italic"
  );

  doc.setFontSize(
    4.9
  );

  doc.text(
    EMPRESA.domicilio1,
    centerX,
    13.5,
    {
      align:
        "center",
    }
  );

  doc.text(
    EMPRESA.domicilio2,
    centerX,
    16.5,
    {
      align:
        "center",
    }
  );

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(
    5.5
  );

  doc.text(
    `RIF: ${EMPRESA.rif}`,
    PAGE_W -
      X -
      32,
    4
  );

  doc.setDrawColor(
    ...AZUL
  );

  doc.setLineWidth(
    0.75
  );

  doc.line(
    X,
    20,
    PAGE_W - X,
    20
  );

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(
    5.4
  );

  doc.text(
    EMPRESA.telefono1,
    X,
    24
  );

  doc.text(
    EMPRESA.telefono2,
    X + 43,
    24
  );

  doc.text(
    EMPRESA.telefono3,
    X + 88,
    24
  );

  doc.text(
    EMPRESA.email,
    PAGE_W - X,
    24,
    {
      align:
        "right",
    }
  );

  linea(
    doc,
    X,
    26,
    PAGE_W - X,
    26,
    0.3
  );

  /* FECHA NOTA */

  const fecha =
    obtenerPartesFecha(
      primerValor(
        nota?.fecha,
        nota?.created_at,
        new Date()
      )
    );

  const y = 28;
  const h = 11.5;

  const dateW = 70;
  const rifW = 53;

  const noteW =
    W -
    dateW -
    rifW -
    2;

  dibujarFecha(
    doc,
    X,
    y,
    dateW,
    h,
    fecha
  );

  /* RIF CLIENTE */

  const rifX =
    X +
    dateW +
    1;

  rect(
    doc,
    rifX,
    y,
    rifW,
    h,
    1
  );

  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.setFontSize(
    4.9
  );

  doc.setTextColor(
    ...AZUL
  );

  doc.text(
    "N° RIF / C.I. N° o Pasaporte N°:",
    rifX +
      rifW / 2,
    y + 3.4,
    {
      align:
        "center",
    }
  );

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(
    7
  );

  doc.text(
    String(
      datos.clienteRif ||
        ""
    ),
    rifX +
      rifW / 2,
    y + 8.3,
    {
      align:
        "center",
    }
  );

  /* NOTA DÉBITO */

  const noteX =
    rifX +
    rifW +
    1;

  rect(
    doc,
    noteX,
    y,
    noteW,
    h,
    1
  );

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(
    6.2
  );

  doc.setTextColor(
    ...AZUL
  );

  doc.text(
    "NOTA DE",
    noteX + 2,
    y + 4
  );

  doc.text(
    "DÉBITO",
    noteX + 2,
    y + 7.8
  );

  doc.setTextColor(
    ...ROJO
  );

  doc.setFontSize(
    6.2
  );

  doc.text(
    "N°",
    noteX + 23,
    y + 6.2
  );

  doc.setFont(
    "courier",
    "bold"
  );

  doc.setFontSize(
    8
  );

  doc.text(
    String(
      nota?.n_nota ||
        ""
    ),
    noteX +
      noteW -
      2,
    y + 6.5,
    {
      align:
        "right",
    }
  );

  /* NOMBRE CLIENTE */

  const nameY =
    y +
    h +
    1;

  const nameH =
    8.5;

  colorAzul(doc);

  rect(
    doc,
    X,
    nameY,
    W,
    nameH
  );

  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.setFontSize(
    4.8
  );

  doc.text(
    "Nombre y Apellido",
    X + 2,
    nameY + 3.1
  );

  doc.text(
    "o Razón Social:",
    X + 2,
    nameY + 6
  );

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(
    6.5
  );

  doc.text(
    String(
      datos.clienteNombre ||
        ""
    ),
    X + 31,
    nameY + 5.2
  );

  return (
    nameY +
    nameH
  );
};

/* =========================================================
   REFERENCIA DE FACTURA
   ========================================================= */

const dibujarReferenciaFactura = (
  doc,
  y,
  datos,
  referencia
) => {
  const titleH = 4;
  const rowH = 8;

  colorAzul(doc);

  rect(
    doc,
    X,
    y,
    W,
    titleH +
      rowH
  );

  linea(
    doc,
    X,
    y +
      titleH,
    X + W,
    y +
      titleH
  );

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(
    5.2
  );

  doc.text(
    "REFERENCIA DE LA FACTURA QUE SOPORTÓ LA OPERACIÓN",
    X +
      W / 2,
    y + 2.8,
    {
      align:
        "center",
    }
  );

  const fechaW = 61;
  const facturaW = 61;

  const montoW =
    W -
    fechaW -
    facturaW;

  linea(
    doc,
    X +
      fechaW,
    y +
      titleH,
    X +
      fechaW,
    y +
      titleH +
      rowH
  );

  linea(
    doc,
    X +
      fechaW +
      facturaW,
    y +
      titleH,
    X +
      fechaW +
      facturaW,
    y +
      titleH +
      rowH
  );

  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.setFontSize(
    4.7
  );

  doc.setTextColor(
    ...AZUL
  );

  doc.text(
    "FECHA",
    X + 1,
    y +
      titleH +
      2
  );

  doc.text(
    "N° FACTURA",
    X +
      fechaW +
      1,
    y +
      titleH +
      2
  );

  doc.text(
    `MONTO ${referencia.monedaLabel}`,
    X +
      fechaW +
      facturaW +
      1,
    y +
      titleH +
      2
  );

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(
    6
  );

  doc.text(
    formatearFecha(
      datos.fechaFactura
    ),
    X +
      fechaW / 2,
    y +
      titleH +
      6,
    {
      align:
        "center",
    }
  );

  doc.text(
    String(
      datos.nFactura ||
        ""
    ),
    X +
      fechaW +
      facturaW / 2,
    y +
      titleH +
      6,
    {
      align:
        "center",
    }
  );

  doc.text(
    formatNumero(
      referencia.monto
    ),
    X +
      fechaW +
      facturaW +
      montoW -
      2,
    y +
      titleH +
      6,
    {
      align:
        "right",
    }
  );

  return (
    y +
    titleH +
    rowH
  );
};

/* =========================================================
   TABLA
   ========================================================= */

const dibujarTabla = (
  doc,
  y,
  items,
  convertirMonto
) => {
  const tableH = 37;

  const headerH =
    5.5;

  const bodyH =
    tableH -
    headerH;

  const rowH =
    bodyH /
    ITEM_ROWS;

  const c1 = 15;
  const c2 = 108;
  const c3 = 32;

  const c4 =
    W -
    c1 -
    c2 -
    c3;

  const x1 = X;
  const x2 =
    x1 + c1;
  const x3 =
    x2 + c2;
  const x4 =
    x3 + c3;

  colorAzul(doc);

  rect(
    doc,
    X,
    y,
    W,
    tableH
  );

  linea(
    doc,
    X,
    y +
      headerH,
    X + W,
    y +
      headerH
  );

  linea(
    doc,
    x2,
    y,
    x2,
    y +
      tableH
  );

  linea(
    doc,
    x3,
    y,
    x3,
    y +
      tableH
  );

  linea(
    doc,
    x4,
    y,
    x4,
    y +
      tableH
  );

  for (
    let i = 1;
    i < ITEM_ROWS;
    i += 1
  ) {
    const yy =
      y +
      headerH +
      rowH * i;

    linea(
      doc,
      X,
      yy,
      X + W,
      yy,
      0.15
    );
  }

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(
    4.6
  );

  doc.setTextColor(
    ...AZUL
  );

  doc.text(
    "Cantidad",
    x1 +
      c1 / 2,
    y + 3.5,
    {
      align:
        "center",
    }
  );

  doc.text(
    "Descripción de la Venta del Bien o de la Prestación del Servicio (E)",
    x2 +
      c2 / 2,
    y + 3.5,
    {
      align:
        "center",
    }
  );

  doc.text(
    "Precio Unitario",
    x3 +
      c3 / 2,
    y + 3.5,
    {
      align:
        "center",
    }
  );

  doc.text(
    "Monto del Bien o Servicio",
    x4 +
      c4 / 2,
    y + 3.5,
    {
      align:
        "center",
    }
  );

  const filas =
    Array.isArray(items)
      ? items.slice(
          0,
          ITEM_ROWS
        )
      : [];

  filas.forEach(
    (
      item,
      index
    ) => {
      const rowY =
        y +
        headerH +
        rowH *
          index;

      textoEnCaja(
        doc,

        formatCantidad(
          item.cantidad
        ),

        x1,
        rowY,
        c1,
        rowH,

        {
          fontSize: 5,
          align: "center",
          maxLines: 1,
        }
      );

      textoEnCaja(
        doc,

        item.descripcion,

        x2,
        rowY,
        c2,
        rowH,

        {
          fontSize: 4.4,
          align: "left",
          maxLines: 2,
          paddingX: 1,
        }
      );

      textoEnCaja(
        doc,

        formatNumero(
          convertirMonto(
            item.precio_unitario
          )
        ),

        x3,
        rowY,
        c3,
        rowH,

        {
          fontSize: 5,
          align: "right",
          maxLines: 1,
        }
      );

      textoEnCaja(
        doc,

        formatNumero(
          convertirMonto(
            item.total_item
          )
        ),

        x4,
        rowY,
        c4,
        rowH,

        {
          fontSize: 5,
          align: "right",
          maxLines: 1,
        }
      );
    }
  );

  return (
    y +
    tableH
  );
};

/* =========================================================
   PIE
   ========================================================= */

const dibujarPie = (
  doc,
  y,
  montos,
  datos,
  monedaLabel
) => {
  const {
    exento,
    baseImponible,
    iva,
    total,
    porcentajeIva,
  } = montos;

  colorAzul(doc);

  const valuesX =
    156;

  const valuesW =
    PAGE_W -
    X -
    valuesX;

  const totalH = 26;

  const rowH =
    totalH /
    4;

  rect(
    doc,
    valuesX,
    y,
    valuesW,
    totalH,
    1
  );

  for (
    let i = 1;
    i < 4;
    i += 1
  ) {
    linea(
      doc,
      valuesX,
      y +
        rowH *
          i,
      valuesX +
        valuesW,
      y +
        rowH *
          i
    );
  }

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(
    4.4
  );

  doc.setTextColor(
    ...AZUL
  );

  doc.text(
    `Monto Total Exento o Exonerado ${monedaLabel}`,
    valuesX - 2,
    y + 4,
    {
      align:
        "right",
    }
  );

  doc.text(
    `Base Imponible ${porcentajeIva}% ${monedaLabel}`,
    valuesX - 2,
    y +
      rowH +
      4,
    {
      align:
        "right",
    }
  );

  doc.text(
    `IVA ${porcentajeIva}% ${monedaLabel}`,
    valuesX - 2,
    y +
      rowH *
        2 +
      4,
    {
      align:
        "right",
    }
  );

  doc.setFontSize(
    5.1
  );

  doc.text(
    `Valor Total ${monedaLabel}`,
    valuesX - 2,
    y +
      rowH *
        3 +
      4.2,
    {
      align:
        "right",
    }
  );

  textoEnCaja(
    doc,
    formatNumero(
      exento
    ),
    valuesX,
    y,
    valuesW,
    rowH,
    {
      fontSize: 5.5,
      align: "right",
    }
  );

  textoEnCaja(
    doc,
    formatNumero(
      baseImponible
    ),
    valuesX,
    y +
      rowH,
    valuesW,
    rowH,
    {
      fontSize: 5.5,
      align: "right",
    }
  );

  textoEnCaja(
    doc,
    formatNumero(
      iva
    ),
    valuesX,
    y +
      rowH *
        2,
    valuesW,
    rowH,
    {
      fontSize: 5.5,
      align: "right",
    }
  );

  textoEnCaja(
    doc,
    formatNumero(
      total
    ),
    valuesX,
    y +
      rowH *
        3,
    valuesW,
    rowH,
    {
      fontSize: 6.2,
      fontStyle: "bold",
      align: "right",
    }
  );

  /* ORIGINAL */

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(
    6.4
  );

  doc.setTextColor(
    ...ROJO
  );

  doc.text(
    "ORIGINAL: CLIENTE",
    X + 3,
    y + 5
  );

  /* TEXTO LEGAL */

  doc.setTextColor(
    ...AZUL
  );

  doc.setFontSize(
    5.1
  );

  doc.text(
    "ESTE DOCUMENTO VA SIN TACHADURAS NI ENMENDADURAS",
    X + 3,
    y + 11
  );

  /* =====================================================
     ORDEN DE CONTROL
     ===================================================== */

  const controlY =
    y + 14;

  const controlW =
    83;

  const controlH =
    10;

  rect(
    doc,
    X + 3,
    controlY,
    controlW,
    controlH,
    1
  );

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(
    6.4
  );

  doc.setTextColor(
    ...AZUL
  );

  doc.text(
    "Orden de control",
    X + 6,
    controlY + 6.4
  );

  doc.setTextColor(
    ...ROJO
  );

  doc.text(
    "N°",
    X + 43,
    controlY + 6.4
  );

  doc.setFont(
    "courier",
    "bold"
  );

  doc.setFontSize(
    7.3
  );

  doc.text(
    String(
      datos?.ordenControl ||
        ""
    ),
    X + 82,
    controlY + 6.5,
    {
      align:
        "right",
    }
  );
};

/* =========================================================
   CONSTRUIR DOCUMENTO
   ========================================================= */

const construirDoc = async (
  nota = {},
  extra = {}
) => {
  const doc =
    new jsPDF({
      orientation:
        "landscape",

      unit:
        "mm",

      format: [
        PAGE_W,
        PAGE_H,
      ],

      compress:
        true,
    });

  /* =====================================================
     DATOS FACTURA
     ===================================================== */

  const datos =
    resolverDatosFactura(
      nota,
      extra
    );

  /* =====================================================
     ITEMS
     ===================================================== */

  const items =
    resolverItemsFactura(
      nota,
      datos.factura
    );

  /* =====================================================
     MONEDA
     ===================================================== */

  const moneda =
    normalizarMoneda(
      primerValor(
        nota?.moneda,
        datos.monedaFactura,
        "BS"
      )
    );

  /* =====================================================
     TASA BCV
     ===================================================== */

  const tasa =
    convertirNumero(
      primerValor(
        nota?.tasa_bs_usd,

        nota?.tasa_bcv,

        extra
          ?.tasaBCV
          ?.promedio,

        extra
          ?.tasaBCV
          ?.tasa,

        extra?.tasa,

        extra?.tasa_bcv,

        datos?.factura
          ?.tasa_bs_usd,

        datos?.factura
          ?.tasa_bcv,

        datos?.factura
          ?.tasa,

        0
      )
    );

  /* =====================================================
     CONVERSIÓN
     ===================================================== */

  const convertirMontoNota = (
    amount
  ) => {
    const numero =
      convertirNumero(
        amount
      );

    if (
      moneda === "USD" &&
      tasa > 0
    ) {
      return (
        numero *
        tasa
      );
    }

    return numero;
  };

  const monedaImpresion =
    moneda === "USD" &&
    tasa <= 0
      ? "USD"
      : "Bs.";

  if (
    moneda === "USD" &&
    tasa <= 0
  ) {
    console.warn(
      "NOTA DE DÉBITO: La nota está en USD pero no llegó una tasa BCV válida. Los montos se imprimirán en USD."
    );
  }

  /* =====================================================
     SUBTOTAL ITEMS
     ===================================================== */

  const subtotalItems =
    items.reduce(
      (
        acumulado,
        item
      ) =>
        acumulado +
        convertirNumero(
          item.total_item
        ),
      0
    );

  /* =====================================================
     TOTALES
     ===================================================== */

  const subtotalOriginal =
    convertirNumero(
      primerValor(
        nota?.subtotal,
        extra?.subtotal,
        subtotalItems,
        0
      )
    );

  const descuentoOriginal =
    convertirNumero(
      primerValor(
        nota?.monto_descuento,
        nota?.descuento,
        extra?.monto_descuento,
        0
      )
    );

  const exentoOriginal =
    convertirNumero(
      primerValor(
        nota?.monto_exento,
        nota?.total_exento,
        extra?.monto_exento,
        0
      )
    );

  const porcentajeIva =
    convertirNumero(
      primerValor(
        nota?.porcentaje_iva,
        nota?.iva_porcentaje,
        extra?.porcentaje_iva,
        16
      )
    ) || 16;

  let baseImponibleOriginal =
    convertirNumero(
      primerValor(
        nota?.base_imponible,
        extra?.base_imponible,
        0
      )
    );

  if (
    baseImponibleOriginal ===
    0
  ) {
    baseImponibleOriginal =
      Math.max(
        0,

        subtotalOriginal -
          descuentoOriginal -
          exentoOriginal
      );
  }

  let totalOriginal =
    convertirNumero(
      primerValor(
        nota?.total,
        nota?.monto_total,
        extra?.total,
        0
      )
    );

  let ivaOriginal =
    convertirNumero(
      primerValor(
        nota?.monto_iva,
        nota?.iva,
        extra?.monto_iva,
        0
      )
    );

  /*
   * Si tenemos total pero no IVA:
   * total - base - exento
   */
  if (
    ivaOriginal === 0 &&
    totalOriginal > 0
  ) {
    const diferencia =
      totalOriginal -
      baseImponibleOriginal -
      exentoOriginal;

    if (
      diferencia > 0
    ) {
      ivaOriginal =
        diferencia;
    }
  }

  /*
   * Si tampoco tenemos total
   * calculamos IVA con porcentaje.
   */
  if (
    ivaOriginal === 0 &&
    baseImponibleOriginal >
      0
  ) {
    ivaOriginal =
      (
        baseImponibleOriginal *
        porcentajeIva
      ) /
      100;
  }

  /*
   * Total calculado.
   */
  if (
    totalOriginal === 0
  ) {
    totalOriginal =
      baseImponibleOriginal +
      exentoOriginal +
      ivaOriginal;
  }

  /* =====================================================
     MONTOS A IMPRIMIR
     ===================================================== */

  const montos = {
    exento:
      convertirMontoNota(
        exentoOriginal
      ),

    baseImponible:
      convertirMontoNota(
        baseImponibleOriginal
      ),

    iva:
      convertirMontoNota(
        ivaOriginal
      ),

    total:
      convertirMontoNota(
        totalOriginal
      ),

    porcentajeIva,

    originales: {
      subtotal:
        subtotalOriginal,

      descuento:
        descuentoOriginal,

      exento:
        exentoOriginal,

      baseImponible:
        baseImponibleOriginal,

      iva:
        ivaOriginal,

      total:
        totalOriginal,
    },
  };

  /* =====================================================
     REFERENCIA FACTURA
     ===================================================== */

  let montoReferencia = 0;

  let monedaReferencia =
    monedaImpresion;

  /*
   * Monto explícito en Bs.
   */
  if (
    datos.montoFacturaBs >
      0
  ) {
    montoReferencia =
      datos.montoFacturaBs;

    monedaReferencia =
      "Bs.";
  }

  /*
   * Monto original factura.
   */
  else if (
    datos.montoFactura >
      0
  ) {
    if (
      datos.monedaFactura ===
        "USD" &&
      tasa > 0
    ) {
      montoReferencia =
        datos.montoFactura *
        tasa;

      monedaReferencia =
        "Bs.";
    } else {
      montoReferencia =
        datos.montoFactura;

      monedaReferencia =
        datos.monedaFactura ===
        "USD"
          ? "USD"
          : "Bs.";
    }
  }

  /*
   * Fallback al total de nota.
   */
  else {
    montoReferencia =
      montos.total;

    monedaReferencia =
      monedaImpresion;
  }

  const referencia = {
    monto:
      montoReferencia,

    monedaLabel:
      monedaReferencia,
  };

  /* =====================================================
     DIBUJAR
     ===================================================== */

  const endHeader =
    await dibujarEncabezado(
      doc,
      nota,
      datos
    );

  const endFactura =
    dibujarReferenciaFactura(
      doc,
      endHeader + 1,
      datos,
      referencia
    );

  const endTabla =
    dibujarTabla(
      doc,
      endFactura + 1,
      items,
      convertirMontoNota
    );

  dibujarPie(
    doc,
    endTabla + 1,
    montos,
    datos,
    monedaImpresion
  );

  return {
    doc,

    datos,

    items,

    tasa,

    moneda,

    monedaImpresion,

    referencia,

    montos,

    overflow:
      items.length >
      ITEM_ROWS,
  };
};

/* =========================================================
   DEBUG
   ========================================================= */

const imprimirDebug = (
  nota,
  extra,
  resultado
) => {
  console.group(
    "========== NOTA DE DÉBITO DEBUG =========="
  );

  console.log(
    "1. NOTA COMPLETA:",
    nota
  );

  console.log(
    "2. EXTRA COMPLETO:",
    extra
  );

  console.log(
    "3. FACTURA ENCONTRADA:",
    resultado?.datos
      ?.factura
  );

  console.log(
    "4. DATOS RESUELTOS:",
    resultado?.datos
  );

  console.log(
    "5. MONEDA ORIGINAL:",
    resultado?.moneda
  );

  console.log(
    "6. TASA BCV:",
    resultado?.tasa
  );

  console.log(
    "7. MONEDA IMPRESIÓN:",
    resultado
      ?.monedaImpresion
  );

  console.log(
    "8. PRIMER ITEM ORIGINAL:",
    nota?.items?.[0]
  );

  if (
    nota?.items?.[0]
  ) {
    console.log(
      "9. CAMPOS DEL PRIMER ITEM:",
      Object.keys(
        nota.items[0]
      )
    );
  }

  console.log(
    "10. ITEMS RESUELTOS:",
    resultado?.items
  );

  console.table(
    resultado?.items?.map(
      (item) => ({
        cantidad:
          item.cantidad,

        descripcion:
          item.descripcion,

        precio_unitario:
          item.precio_unitario,

        total_item:
          item.total_item,
      })
    ) || []
  );

  console.log(
    "11. TOTALES ORIGINALES:",
    resultado?.montos
      ?.originales
  );

  console.log(
    "12. TOTALES IMPRESOS:",
    {
      exento:
        resultado?.montos
          ?.exento,

      baseImponible:
        resultado?.montos
          ?.baseImponible,

      iva:
        resultado?.montos
          ?.iva,

      total:
        resultado?.montos
          ?.total,
    }
  );

  console.log(
    "13. REFERENCIA FACTURA:",
    resultado?.referencia
  );

  console.log(
    "14. DATOS FALTANTES:",
    {
      fechaFactura:
        resultado?.datos
          ?.fechaFactura ||
        "NO RECIBIDA",

      ordenControl:
        resultado?.datos
          ?.ordenControl ||
        "NO RECIBIDA",
    }
  );

  console.groupEnd();
};

/* =========================================================
   HOOK
   ========================================================= */

export default function usePDFNotaDebito() {
  const generarPDFNotaDebito =
    async (
      nota,
      extra = {}
    ) => {
      try {
        const resultado =
          await construirDoc(
            nota,
            extra
          );

        imprimirDebug(
          nota,
          extra,
          resultado
        );

        if (
          resultado.overflow
        ) {
          return {
            ok: false,

            motivo:
              "LIMITE",

            maxItems:
              ITEM_ROWS,
          };
        }

        resultado.doc.save(
          generarNombreArchivo(
            nota,
            resultado.datos
          )
        );

        return {
          ok: true,

          doc:
            resultado.doc,

          datosFactura:
            resultado.datos,

          items:
            resultado.items,

          montos:
            resultado.montos,

          tasa:
            resultado.tasa,

          moneda:
            resultado.moneda,

          monedaImpresion:
            resultado.monedaImpresion,
        };
      } catch (error) {
        console.error(
          "ERROR GENERANDO NOTA DE DÉBITO:",
          error
        );

        console.error(
          "NOTA RECIBIDA:",
          nota
        );

        console.error(
          "EXTRA RECIBIDO:",
          extra
        );

        return {
          ok: false,

          motivo:
            "ERROR",

          error,
        };
      }
    };

  return {
    generarPDFNotaDebito,
    calcularMaxItems,
  };
}