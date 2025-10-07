import React, { useMemo } from "react";

export default function Etapa3({ formData, onCreate }) {
  const {
    cliente,
    descripcion,
    fechaCulminacion,
    stock_almacen,
    consumibles,
    epps,
    presupuesto_base,
    porcentaje_productividad,
  } = formData;

  // 🧮 Cálculo local de costos (con ajuste por productividad)
  const resumen = useMemo(() => {
    const calcularCosto = (lista = []) =>
      lista.reduce((acc, item) => {
        const precio = Number(item.monto || item.costo_unitario || 0);
        const cantidad = Number(item.cantidad || 0);
        return acc + precio * cantidad;
      }, 0);

    const costoEPP = calcularCosto(epps);
    const costoStock = calcularCosto(stock_almacen);
    const costoCons = calcularCosto(consumibles);

    const totalMateriales = costoEPP + costoStock + costoCons;
    const totalBase = totalMateriales + Number(presupuesto_base || 0);

    // 🧠 Ajuste por productividad: si productividad = 0.75 → se suma 25%
    const factorAjuste = 1 - (Number(porcentaje_productividad) || 0);
    const totalConProductividad = totalBase + totalBase * factorAjuste;

    return {
      costoEPP,
      costoStock,
      costoCons,
      totalMateriales,
      presupuesto_base: Number(presupuesto_base || 0),
      totalBase,
      factorAjuste,
      totalConProductividad,
    };
  }, [epps, stock_almacen, consumibles, presupuesto_base, porcentaje_productividad]);

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg min-h-[400px]">
      {/* ENCABEZADO */}
      <h2 className="text-2xl font-semibold text-center text-[#0B2C4D] mb-8">
        Confirmación Final del Presupuesto
      </h2>

      {/* INFORMACIÓN DEL CLIENTE */}
      <div className="max-w-3xl mx-auto mb-10 bg-gray-50 rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-[#0B2C4D] mb-4 text-center">
          Información del Cliente
        </h3>

        {cliente ? (
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm text-gray-700">
            <p>
              <strong>Nombre:</strong> {cliente.nombre}
            </p>
            <p>
              <strong>RIF / Cédula:</strong> {cliente.rif || "—"}
            </p>
            <p>
              <strong>Teléfono:</strong> {cliente.telefono || "—"}
            </p>
            <p>
              <strong>Email:</strong> {cliente.email || "—"}
            </p>
            <p className="col-span-2">
              <strong>Dirección:</strong> {cliente.direccion || "Sin dirección"}
            </p>
          </div>
        ) : (
          <p className="text-center text-gray-500 italic">
            No hay cliente seleccionado.
          </p>
        )}
      </div>

      {/* INFORMACIÓN DEL PRESUPUESTO */}
      <div className="max-w-3xl mx-auto mb-10 bg-gray-50 rounded-lg border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-[#0B2C4D] mb-4 text-center">
          Detalles del Presupuesto
        </h3>

        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm text-gray-700">
          <p>
            <strong>Fecha estimada de culminación:</strong>{" "}
            {fechaCulminacion
              ? new Date(fechaCulminacion).toLocaleDateString("es-VE")
              : "No definida"}
          </p>
          <p>
            <strong>Productividad estimada:</strong>{" "}
            {porcentaje_productividad
              ? `${(porcentaje_productividad * 100).toFixed(0)}%`
              : "No definida"}
          </p>
          <p className="col-span-2">
            <strong>Descripción del proyecto:</strong>{" "}
            {descripcion || "Sin observaciones registradas"}
          </p>
        </div>

        {/* 💰 TOTAL DEL PRESUPUESTO */}
        <div className="mt-6 text-center border-t pt-4">
          <p className="text-base font-semibold text-[#0B2C4D] mb-1">
            Presupuesto estimado total 
          </p>

          <p className="text-3xl font-bold text-green-700 tracking-wide">
            {resumen.totalConProductividad
              ? `$ ${resumen.totalConProductividad.toLocaleString("es-VE", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`
              : "$ 0.00"}
          </p>

          {/* Desglose simple */}
          <div className="mt-3 text-xs text-gray-600 leading-relaxed">
            <p>
              Base: ${resumen.presupuesto_base.toFixed(2)} + Materiales: $
              {resumen.totalMateriales.toFixed(2)} = $
              {resumen.totalBase.toFixed(2)}
            </p>
            <p>
              Productividad: +{(resumen.factorAjuste * 100).toFixed(0)}% → $
              {(resumen.totalBase * resumen.factorAjuste).toFixed(2)} extra
            </p>
          </div>
        </div>
      </div>

      {/* TABLAS DE RECURSOS */}
      <div className="space-y-10 max-w-4xl mx-auto">
        <TablaBloque
          titulo="Equipos de Protección Personal (EPP)"
          data={epps}
          tipo="EPP"
        />
        <TablaBloque
          titulo="Materiales de Ferretería"
          data={stock_almacen}
          tipo="Ferretería"
        />
        <TablaBloque
          titulo="Consumibles"
          data={consumibles}
          tipo="Consumibles"
        />
      </div>

      {/* BOTÓN FINAL */}
      <div className="flex justify-center mt-12">
        <button
           onClick={() => onCreate(resumen.totalConProductividad)} 
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg shadow-md transition-all"
        >
          Confirmar y Crear Presupuesto
        </button>
      </div>
    </div>
  );
}

/**
 * 🧩 Tabla bloque con título + tabla de materiales
 */
function TablaBloque({ titulo, data, tipo }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 shadow-sm">
      <h4 className="text-md font-semibold text-[#0B2C4D] mb-3 text-center">
        {titulo}
      </h4>
      <TablaMateriales data={data} tipo={tipo} />
    </div>
  );
}

/**
 * 🧩 TablaMateriales – Renderiza listas de materiales de EPP, Ferretería o Consumibles
 */
function TablaMateriales({ data = [], tipo }) {
  const mostrarModelo = tipo?.toLowerCase() !== "epp";

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm border-collapse text-gray-700">
        <thead>
          <tr className="bg-[#0B2C4D] text-white">
            <th className="py-2 px-4 text-left font-medium">Nombre</th>
            {mostrarModelo && (
              <th className="py-2 px-4 text-center font-medium">Modelo</th>
            )}
            <th className="py-2 px-4 text-center font-medium">Cantidad</th>
            <th className="py-2 px-4 text-center font-medium">Precio Unitario</th>
            <th className="py-2 px-4 text-center font-medium">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {data && data.length > 0 ? (
            data.map((item, index) => {
              const precio = Number(item.monto || item.costo_unitario || 0);
              const cantidad = Number(item.cantidad || 0);
              const subtotal = precio * cantidad;
              return (
                <tr
                  key={`${tipo}-${item.id}-${index}`}
                  className={`${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  } border-b`}
                >
                  <td className="py-2 px-4">{item.name || "—"}</td>
                  {mostrarModelo && (
                    <td className="py-2 px-4 text-center">
                      {item.modelo || "—"}
                    </td>
                  )}
                  <td className="py-2 px-4 text-center">{cantidad}</td>
                  <td className="py-2 px-4 text-center">
                    ${precio.toFixed(2)}
                  </td>
                  <td className="py-2 px-4 text-center font-medium">
                    ${subtotal.toFixed(2)}
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td
                colSpan={mostrarModelo ? 5 : 4}
                className="py-3 text-center text-gray-500 italic"
              >
                No hay {tipo?.toLowerCase()} registrados.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
