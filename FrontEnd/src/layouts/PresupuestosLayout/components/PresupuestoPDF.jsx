import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// 🖋️ Estilos del PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    color: "#333",
    fontFamily: "Helvetica",
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 10,
    alignSelf: "center",
  },
  header: {
    textAlign: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0B2C4D",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: "#555",
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#0B2C4D",
    marginBottom: 6,
    textDecoration: "underline",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#0B2C4D",
    color: "#fff",
    fontWeight: "bold",
    padding: 5,
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1pt solid #ccc",
    padding: 5,
  },
  col: {
    flex: 1,
    textAlign: "center",
  },
  footer: {
    textAlign: "center",
    marginTop: 30,
    fontSize: 9,
    color: "#888",
  },
  notaBox: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#F3F4F6",
    borderRadius: 5,
    borderLeft: "3pt solid #0B2C4D",
    textAlign: "left",
  },
  notaTitulo: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#0B2C4D",
    marginBottom: 4,
  },
  notaDescripcion: {
    fontSize: 10,
    color: "#555",
    lineHeight: 14,
  },
  disclaimer: {
    marginTop: 15,
    fontSize: 9,
    color: "#666",
    textAlign: "left",
    lineHeight: 13,
  },
});

// 🧾 Componente principal
export default function PresupuestoPDF({ formData, resumen, logoSrc }) {
  const {
    cliente,
    descripcion,
    fechaCulminacion,
    epps,
    stock_almacen,
    consumibles,
    titulo,
    notas,
  } = formData;

  // Verificar si hay nota para mostrar
  const tieneNota = (titulo && titulo !== "Nota") || notas;

  const renderTable = (titulo, data) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{titulo}</Text>
      <View style={styles.tableHeader}>
        <Text style={[styles.col, { flex: 2 }]}>Nombre</Text>
        <Text style={styles.col}>Cantidad</Text>
        <Text style={styles.col}>Precio Unit.</Text>
        <Text style={styles.col}>Subtotal</Text>
      </View>
      {data && data.length > 0 ? (
        data.map((item, i) => {
          const precio = Number(item.monto || item.costo_unitario || 0);
          const cantidad = Number(item.cantidad || 0);
          const subtotal = precio * cantidad;
          return (
            <View style={styles.tableRow} key={`${titulo}-${i}`}>
              <Text style={[styles.col, { flex: 2 }]}>{item.name || "—"}</Text>
              <Text style={styles.col}>{cantidad}</Text>
              <Text style={styles.col}>${precio.toFixed(2)}</Text>
              <Text style={styles.col}>${subtotal.toFixed(2)}</Text>
            </View>
          );
        })
      ) : (
        <Text style={{ fontStyle: "italic", marginTop: 5 }}>
          No hay registros.
        </Text>
      )}
    </View>
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* LOGO Y ENCABEZADO */}
        {logoSrc && <Image src={logoSrc} style={styles.logo} />}
        <View style={styles.header}>
          <Text style={styles.title}>Presupuesto Detallado</Text>
          <Text style={styles.subtitle}>
            Generado automáticamente por el sistema
          </Text>
        </View>

        {/* INFORMACIÓN DEL CLIENTE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información del Cliente</Text>
          {cliente ? (
            <>
              <Text>Nombre: {cliente.nombre}</Text>
              <Text>RIF / Cédula: {cliente.rif || "—"}</Text>
              <Text>Teléfono: {cliente.telefono || "—"}</Text>
              <Text>Email: {cliente.email || "—"}</Text>
              <Text>Dirección: {cliente.direccion || "—"}</Text>
            </>
          ) : (
            <Text>Cliente no seleccionado.</Text>
          )}
        </View>

        {/* DETALLES DEL PRESUPUESTO */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalles del Presupuesto</Text>
          <Text>
            Fecha estimada de culminación:{" "}
            {new Date(fechaCulminacion).toLocaleDateString("es-VE")}
          </Text>
          <Text>
            Descripción: {descripcion || "Sin observaciones registradas"}
          </Text>
          <Text>Presupuesto base: ${resumen.presupuesto_base.toFixed(2)}</Text>
          <Text>Total materiales: ${resumen.totalMateriales.toFixed(2)}</Text>
          <Text>
            Factor productividad: {(resumen.factorAjuste * 100).toFixed(0)}%
          </Text>
        </View>

        {/* TABLAS */}
        {renderTable("Equipos de Protección Personal (EPP)", epps)}
        {renderTable("Materiales de Ferretería", stock_almacen)}
        {renderTable("Consumibles", consumibles)}

        {/* TOTAL */}
        <View style={[styles.section, { textAlign: "right" }]}>
          <Text style={{ fontSize: 12, fontWeight: "bold", color: "#0B2C4D" }}>
            Total Final: ${resumen.totalConProductividad.toFixed(2)}
          </Text>
        </View>

        {/* DISCLAIMER */}
        <Text style={styles.disclaimer}>
          LOS PRECIOS NO INCLUYEN IVA. LO QUE NO SE ENCUENTRE EN EL PRESENTE PRESUPUESTO SERÁ PRESUPUESTADO POR APARTE.
        </Text>

        {/* NOTA (si existe) */}
        {tieneNota && (
          <View style={styles.notaBox}>
            {titulo && titulo !== "Nota" && (
              <Text style={styles.notaTitulo}>{titulo}</Text>
            )}
            {notas && <Text style={styles.notaDescripcion}>{notas}</Text>}
          </View>
        )}

        {/* FOOTER */}
        <Text style={styles.footer}>
          © {new Date().getFullYear()} - HERMABE | Documento generado
          automáticamente.
        </Text>
      </Page>
    </Document>
  );
}
