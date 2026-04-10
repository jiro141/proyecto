# apus/services/apu_calculator.py
from __future__ import annotations
from decimal import Decimal
from django.db.models import Sum
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from reportes.models import APU


def recalculate_apu_totals(apu: "APU") -> None:
    """
    Recalcula TODOS los campos de totales del APU basándose en los items relacionados.
    """
    # ============================================
    # 1. CALCULAR SUBTOTALES DE CADA SECCIÓN (solo cantidad > 0)
    # ============================================
    
    # Materiales: suma de total_material de cada material (solo cantidad > 0)
    total_materiales = apu.materiales.filter(cantidad__gt=0).aggregate(
        total=Sum("total_material")
    )["total"] or Decimal("0.00")
    
    # Herramientas: suma de total_herramienta de cada herramienta (solo cantidad > 0)
    total_herramientas = apu.herramientas.filter(cantidad__gt=0).aggregate(
        total=Sum("total_herramienta")
    )["total"] or Decimal("0.00")
    
    # Mano de obra: suma de total_mano_obra de cada item (solo cantidad > 0)
    total_mano_obra_base = apu.manos_obra.filter(cantidad__gt=0).aggregate(
        total=Sum("total_mano_obra")
    )["total"] or Decimal("0.00")
    
    # Logística: suma de total_logistica de cada item (solo cantidad > 0)
    total_logistica = apu.logisticas.filter(cantidad__gt=0).aggregate(
        total=Sum("total_logistica")
    )["total"] or Decimal("0.00")

    # ============================================
    # 2. CALCULAR MANO DE OBRA CON BONO Y PRESTACIONES
    # ============================================
    
    # Días trabajados = cantidad total de mano de obra (solo cantidad > 0)
    dias_trabajados = apu.manos_obra.filter(cantidad__gt=0).aggregate(
        total=Sum("cantidad")
    )["total"] or Decimal("0.00")
    
    # Bono alimenticio: $15 por día
    bono_alimenticio = dias_trabajados * Decimal("15.00")
    
    # Prestaciones sociales: 200% del (total mano obra base + logística)
    # Según sistema viejo: se calcula sobre base + logística
    base_para_prestaciones = total_mano_obra_base + total_logistica
    prestaciones_sociales = base_para_prestaciones * Decimal("2.00")
    
    # Total mano de obra = base + bono + prestaciones + logística
    total_mano_obra = total_mano_obra_base + bono_alimenticio + prestaciones_sociales + total_logistica

    # ============================================
    # 3. COSTO POR UNIDAD (incluye logística)
    # ============================================
    
    rendimiento = Decimal(str(apu.rendimiento)) if apu.rendimiento else Decimal("1.000")
    
    # Costo por unidad = mano de obra / rendimiento (sin logística)
    if rendimiento > 0:
        costo_por_unidad = total_mano_obra / rendimiento
    else:
        costo_por_unidad = total_mano_obra
    
    # Costo directo por unidad = costo por unidad + materiales + herramientas/rendimiento
    # NOTA: logística NO se incluye en costo_directo_por_unidad (según sistema viejo)
    herramientas_por_rendimiento = total_herramientas / rendimiento if rendimiento > 0 else Decimal("0.00")
    costo_directo_por_unidad = costo_por_unidad + total_materiales + herramientas_por_rendimiento
    
    # Gastos administrativos 15%
    gastos_administrativos_15 = costo_directo_por_unidad * Decimal("0.15")
    
    # Subtotal
    subtotal = costo_directo_por_unidad + gastos_administrativos_15
    
    # Utilidad 15%
    utilidad_15 = subtotal * Decimal("0.15")
    
    # Total APU = subtotal + utilidad
    total_apu = subtotal + utilidad_15

    # ============================================
    # 4. ACTUALIZAR CAMPOS DEL APU
    # ============================================
    
    apu.total_materiales = total_materiales.quantize(Decimal("0.01"))
    apu.total_herramientas = total_herramientas.quantize(Decimal("0.01"))
    apu.total_mano_obra = total_mano_obra.quantize(Decimal("0.01"))
    apu.total_logistica = total_logistica.quantize(Decimal("0.01"))
    
    apu.bono_alimenticio = bono_alimenticio.quantize(Decimal("0.01"))
    apu.prestaciones_sociales = prestaciones_sociales.quantize(Decimal("0.01"))
    apu.costo_por_unidad = costo_por_unidad.quantize(Decimal("0.01"))
    apu.costo_directo_por_unidad = costo_directo_por_unidad.quantize(Decimal("0.01"))
    apu.gastos_administrativos_15 = gastos_administrativos_15.quantize(Decimal("0.01"))
    apu.subtotal = subtotal.quantize(Decimal("0.01"))
    apu.utilidad_15 = utilidad_15.quantize(Decimal("0.01"))
    apu.total_apu = total_apu.quantize(Decimal("0.01"))
    
    # El presupuesto_base recibe total_apu × cantidad
    cantidad = apu.cantidad or 1
    apu.presupuesto_base = (total_apu * cantidad).quantize(Decimal("0.01"))
    apu.precio_unitario = total_apu.quantize(Decimal("0.01"))
    apu.total_base = total_apu.quantize(Decimal("0.01"))
    
    # Guardar todos los campos calculados
    apu.save(update_fields=[
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
        "presupuesto_base",
        "precio_unitario",
        "total_base",
    ])
    
    # ============================================
    # 5. ACTUALIZAR TOTAL DEL REPORTE
    # ============================================
    
    if apu.reporte_id:
        apu.reporte.recalcular_total()
