# apus/services/apu_calculator.py
from decimal import Decimal


def recalculate_apu_totals(apu: "APU") -> None:
    """
    Recalcula todos los totales del APU y actualiza el total del reporte.

    Esta función contiene la lógica de negocio, no el modelo.
    """

    # Totales de materiales
    total_materiales = sum(m.total_material for m in apu.materiales.all()) or Decimal(
        "0.00"
    )

    # Totales de herramientas
    total_herramientas = sum(
        h.total_herramienta for h in apu.herramientas.all()
    ) or Decimal("0.00")

    # Totales de mano de obra
    mano_obra_base = sum(mo.total_mano_obra for mo in apu.manos_obra.all()) or Decimal(
        "0.00"
    )

    total_trabajadores = sum(mo.cantidad for mo in apu.manos_obra.all()) or Decimal(
        "0.00"
    )

    bono_alimenticio = (Decimal("15.00") * total_trabajadores).quantize(Decimal("0.01"))
    prestaciones_sociales = (mano_obra_base * Decimal("2.00")).quantize(Decimal("0.01"))
    total_mano_obra = (
        mano_obra_base + bono_alimenticio + prestaciones_sociales
    ).quantize(Decimal("0.01"))

    # Totales de logística
    total_logistica = sum(l.total_logistica for l in apu.logisticas.all()) or Decimal(
        "0.00"
    )

    # Presupuesto con depreciación
    presupuesto_con_desp = 0

    # Costo por unidad = prestaciones sociales / rendimiento
    if apu.rendimiento and apu.rendimiento > 0:
        costo_por_unidad = (total_mano_obra / apu.rendimiento).quantize(Decimal("0.01"))
    else:
        costo_por_unidad = Decimal("0.00")

    # Costo directo por unidad
    costo_directo_por_unidad = (
        costo_por_unidad
        + (total_herramientas / apu.rendimiento if apu.rendimiento else Decimal("0.00"))
        + total_materiales
        + total_logistica
        + presupuesto_con_desp
    ).quantize(Decimal("0.01"))

    # 15% de gastos administrativos
    gastos_administrativos_15 = (costo_directo_por_unidad * Decimal("0.15")).quantize(
        Decimal("0.01")
    )

    # Subtotal = costo directo + gastos administrativos
    subtotal = (costo_directo_por_unidad + gastos_administrativos_15).quantize(
        Decimal("0.01")
    )

    # 15% de utilidad
    utilidad_15 = (subtotal * Decimal("0.15")).quantize(Decimal("0.01"))

    # Total APU
    total_apu = (subtotal + utilidad_15).quantize(Decimal("0.01"))

    # total_base: costo directo por unidad
    total_base = costo_directo_por_unidad

    # precio unitario = total APU
    precio_unitario = total_apu

    # Asignar en la instancia
    apu.total_materiales = total_materiales
    apu.total_herramientas = (
        total_herramientas / apu.rendimiento if apu.rendimiento else Decimal("0.00")
    )
    apu.total_mano_obra = total_mano_obra
    apu.total_logistica = total_logistica
    apu.bono_alimenticio = bono_alimenticio
    apu.prestaciones_sociales = prestaciones_sociales
    apu.costo_por_unidad = costo_por_unidad
    apu.costo_directo_por_unidad = costo_directo_por_unidad
    apu.gastos_administrativos_15 = gastos_administrativos_15
    apu.subtotal = subtotal
    apu.utilidad_15 = utilidad_15
    apu.total_apu = total_apu
    apu.total_base = total_base
    apu.precio_unitario = precio_unitario
    apu.presupuesto_con_desp = presupuesto_con_desp

    apu.save(
        update_fields=[
            "total_materiales",
            "total_herramientas",
            "total_mano_obra",
            "total_logistica",
            "bono_alimenticio",
            "prestaciones_sociales",
            "costo_por_unidad",
            "costo_directo_por_unidad",
            "gastos_administrativos_15",
            "subtotal",
            "utilidad_15",
            "total_apu",
            "total_base",
            "precio_unitario",
            "presupuesto_con_desp",
        ]
    )

    # Actualizar total del reporte
    if apu.reporte_id:
        apu.reporte.recalcular_total()
