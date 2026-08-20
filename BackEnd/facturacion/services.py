from decimal import Decimal

from django.db.models import Sum
from django.db import models
from rest_framework.exceptions import ValidationError

from reportes.models import Reporte, EstadoChoices, APU
from .models import Factura, FacturaItem, FacturaConfig, EstadoFactura


def _dec(valor, default="0.00"):
    """Convierte a Decimal de forma segura."""
    if valor is None or valor == "":
        return Decimal(str(default))
    try:
        return Decimal(str(valor))
    except (ValueError, TypeError):
        return Decimal(str(default))


def validar_reporte_facturable(reporte):
    """Solo se puede facturar un presupuesto en estado EJECUTADO."""
    if reporte.estado != EstadoChoices.EJECUTADO:
        raise ValidationError(
            {"reporte": "Solo se pueden facturar presupuestos en estado EJECUTADO."}
        )
    return reporte


def monto_facturado_reporte(reporte, excluir_factura_id=None):
    """
    Monto total ya facturado de un presupuesto (SIN descuento ni IVA),
    normalizado a USD.

    Incluye tanto facturas por APU como facturas con líneas manuales
    (apu_id = null) y facturas en modo "descripción completa".

    Atribución del monto por presupuesto:
    - Factura de UN solo presupuesto: se atribuye su subtotal completo.
    - Factura multi-presupuesto por APUs: se atribuye solo la suma de los
      items cuyos APU pertenecen a ESTE reporte.
    - Factura multi-presupuesto en modo "descripción completa": este reporte
      quedó consumido, se atribuye su total_reporte.

    Cada factura guarda su `moneda` y `tasa_bs_usd`, por eso las facturas
    en Bs se convierten a USD (subtotal / tasa) para una suma coherente.

    `excluir_factura_id` se usa al editar: ignora la factura en curso.
    """
    from .models import FacturaReporte

    # Facturas EMITIDA que incluyen a este reporte (como principal o adicional)
    qs = Factura.objects.filter(
        models.Q(reporte=reporte)
        | models.Q(reportes_vinculados__reporte=reporte),
        estado=EstadoFactura.EMITIDA,
    ).distinct()
    if excluir_factura_id:
        qs = qs.exclude(pk=excluir_factura_id)

    def _a_usd(moneda, tasa, monto):
        monto = monto or Decimal("0.00")
        if moneda == "BS":
            tasa = tasa or Decimal("0.00")
            if tasa > 0:
                return (monto / tasa).quantize(Decimal("0.01"))
            return Decimal("0.00")
        return monto.quantize(Decimal("0.01"))

    total_usd = Decimal("0.00")
    for factura in qs:
        # ¿La factura tiene varios presupuestos vinculados?
        vinculados_ids = list(
            factura.reportes_vinculados.values_list("reporte_id", flat=True)
        )
        multi = len(vinculados_ids) > 1

        if not multi:
            # Factura de un solo presupuesto: atribuir subtotal completo
            total_usd += _a_usd(
                factura.moneda, factura.tasa_bs_usd, factura.subtotal
            )
            continue

        if factura.factura_completa:
            # Modo descripción completa multi: este reporte quedó consumido.
            total_usd += _a_usd(
                factura.moneda, factura.tasa_bs_usd, reporte.total_reporte
            )
            continue

        # Factura multi por APUs: sumar solo los items del reporte.
        # apu_id es None en líneas manuales; se atribuyen al reporte principal.
        items = factura.items.all()
        monto_reporte = Decimal("0.00")
        for item in items:
            if item.apu_id is None:
                if factura.reporte_id == reporte.id:
                    monto_reporte += item.total_item or Decimal("0.00")
            elif item.apu.reporte_id == reporte.id:
                monto_reporte += item.total_item or Decimal("0.00")
        total_usd += _a_usd(factura.moneda, factura.tasa_bs_usd, monto_reporte)

    return total_usd.quantize(Decimal("0.01"))


def total_base_sin_descuento(reporte):
    """
    Total del presupuesto SIN el descuento del reporte:
    = Σ presupuesto_base de los APUs (crudo).
    """
    return (
        reporte.apus.aggregate(total=Sum("presupuesto_base"))["total"]
        or Decimal("0.00")
    )


def restante_facturacion(reporte, excluir_factura_id=None):
    """
    Monto restante por facturar (SIN descuento):
    = total_base_sin_descuento - monto_facturado_reporte.
    Nunca menor a 0.
    """
    restante = (
        total_base_sin_descuento(reporte)
        - monto_facturado_reporte(reporte, excluir_factura_id=excluir_factura_id)
    )
    return max(restante, Decimal("0.00"))


def obtener_pendiente_apu(apu, excluir_factura_id=None):
    """
    Cantidad pendiente por facturar de un APU.
    = cantidad del APU - cantidad ya facturada en facturas EMITIDA.
    """
    qs = FacturaItem.objects.filter(
        apu_id=apu.id,
        factura__estado=EstadoFactura.EMITIDA,
    )
    if excluir_factura_id:
        qs = qs.exclude(factura_id=excluir_factura_id)
    ya_facturado = qs.aggregate(total=Sum("cantidad"))["total"] or Decimal("0.00")
    pendiente = (apu.cantidad or Decimal("0.00")) - ya_facturado
    return max(pendiente, Decimal("0.00"))


def validar_items_factura(
    reportes,
    items_data,
    excluir_factura_id=None,
    moneda="USD",
    tasa_bs_usd=None,
):
    """
    Valida los items de una factura. `reportes` puede ser un solo Reporte o
    una lista de Reportes (factura multi-presupuesto).

    - Por APU: cada item ligado a un APU no puede exceder la cantidad
      pendiente del APU al que pertenece (dentro de cualquiera de los
      reportes del set).
    - Por MONTO: el subtotal de la factura (normalizado a USD) no puede
      superar la SUMA de los restantes de todos los reportes. Cubre las
      líneas manuales (apu_id = null), que no descuentan por APU.
    """
    if isinstance(reportes, Reporte):
        reportes = [reportes]
    reporte_ids = [r.id for r in reportes]

    cantidades_por_apu = {}

    for item in items_data:
        apu_id = item.get("apu_id")
        cantidad = _dec(item.get("cantidad"), "1.00")

        if apu_id:
            apu = APU.objects.filter(pk=apu_id, reporte_id__in=reporte_ids).first()
            if not apu:
                raise ValidationError(
                    {
                        "items": (
                            f"El APU {apu_id} no pertenece a ninguno de los "
                            f"presupuestos de la factura."
                        )
                    }
                )
            cantidades_por_apu[apu_id] = cantidades_por_apu.get(apu_id, Decimal("0.00")) + cantidad

    for apu_id, cantidad in cantidades_por_apu.items():
        apu = APU.objects.get(pk=apu_id)
        pendiente = obtener_pendiente_apu(apu, excluir_factura_id=excluir_factura_id)
        if cantidad > pendiente:
            raise ValidationError(
                {
                    "items": (
                        f"La cantidad a facturar del APU '{apu.descripcion[:50]}' "
                        f"excede el pendiente ({pendiente})."
                    )
                }
            )

    # Validación por MONTO (cubre líneas manuales, apu_id = null):
    # el subtotal de la factura no puede superar la suma de los restantes
    # de los presupuestos del set. Se normaliza a USD si la factura es Bs.
    subtotal_factura = sum(
        (
            _dec(item.get("cantidad"), "1.00") * _dec(item.get("precio_unitario"), "0.00")
            for item in items_data
        ),
        Decimal("0.00"),
    )
    if moneda == "BS":
        tasa = _dec(tasa_bs_usd, "0.00")
        if tasa > 0:
            subtotal_usd = (subtotal_factura / tasa).quantize(Decimal("0.01"))
        else:
            raise ValidationError(
                {"items": "La tasa Bs/USD es obligatoria para validar el monto de la factura."}
            )
    else:
        subtotal_usd = subtotal_factura.quantize(Decimal("0.01"))

    restante_total = sum(
        (
            restante_facturacion(rep, excluir_factura_id=excluir_factura_id)
            for rep in reportes
        ),
        Decimal("0.00"),
    )
    if subtotal_usd > restante_total:
        raise ValidationError(
            {
                "items": (
                    f"El subtotal de la factura ({subtotal_usd} USD) "
                    f"supera el monto restante por facturar de los presupuestos "
                    f"({restante_total.quantize(Decimal('0.01'))} USD)."
                )
            }
        )

    return items_data


def calcular_totales(factura):
    """
    Recalcula subtotal, monto_descuento y total de la factura en su moneda.
    subtotal = Σ (cantidad × precio_unitario) de los items
    monto_descuento = subtotal × porcentaje_descuento / 100
    total = (subtotal - monto_descuento) + monto_iva
    """
    subtotal = sum(
        (item.total_item for item in factura.items.all()),
        Decimal("0.00"),
    )
    pct = _dec(factura.porcentaje_descuento, "0.00")
    monto_descuento = (subtotal * pct / Decimal("100.00")).quantize(Decimal("0.01"))
    base = (subtotal - monto_descuento).quantize(Decimal("0.01"))
    monto_iva = _dec(factura.monto_iva, "0.00")
    total = (base + monto_iva).quantize(Decimal("0.01"))

    factura.subtotal = subtotal.quantize(Decimal("0.01"))
    factura.monto_descuento = monto_descuento
    factura.total = total
    factura.save(
        update_fields=["subtotal", "monto_descuento", "total", "updated_at"]
    )
    return total


def crear_items_factura(factura, items_data):
    """Crea los items de la factura. apu_id es opcional (líneas manuales)."""
    for item in items_data:
        apu_id = item.get("apu_id")
        apu = None
        if apu_id:
            apu = APU.objects.filter(pk=apu_id).first()

        FacturaItem.objects.create(
            factura=factura,
            apu=apu,
            apu_descripcion=item.get("apu_descripcion", "") or "",
            unidad=item.get("unidad", "") or "",
            cantidad=_dec(item.get("cantidad"), "1.00"),
            precio_unitario=_dec(item.get("precio_unitario"), "0.00"),
        )


def reemplazar_items_factura(factura, items_data):
    """Elimina los items actuales y crea los nuevos (edición)."""
    factura.items.all().delete()
    crear_items_factura(factura, items_data)


def proximo_n_factura():
    """Devuelve el siguiente n_factura (Serie-NNNN) sin crear la factura."""
    config = FacturaConfig.objects.first()
    serie = config.serie.strip() if config and config.serie else "A"
    punto_inicio = config.punto_inicio if config and config.punto_inicio else 1

    ultima = Factura.objects.filter(serie=serie).order_by("-numero").first()
    numero = (ultima.numero + 1) if ultima else punto_inicio
    return f"{serie}-{numero:04d}"


def reporte_facturado_completo(reporte, pendiente_por_apu=None):
    """
    True si el reporte está totalmente facturado (ya NO se puede facturar más):

    - Existe al menos una factura EMITIDA con factura_completa=True
      (modo descripción completa: se facturó el monto total), OR
    - El reporte tiene APUs y TODOS están totalmente facturados
      (pendiente total por APU <= 0).

    Caso borde (deliberado): un reporte SIN APUs que nunca se facturó
    NO se considera facturado_completo, para que el modo "descripción
    completa" siga disponible para él. Ese caso solo se marca como
    facturado cuando existe una factura EMITIDA con factura_completa=True.

    `pendiente_por_apu` (opcional) evita recalcular la consulta cuando el
    llamador ya la tiene (dict {apu_id: pendiente}).
    """
    if Factura.objects.filter(
        models.Q(reporte=reporte)
        | models.Q(reportes_vinculados__reporte=reporte),
        estado=EstadoFactura.EMITIDA,
        factura_completa=True,
    ).distinct().exists():
        return True

    if pendiente_por_apu is None:
        pendiente_por_apu = monto_pendiente_por_apu(reporte)

    if not pendiente_por_apu:
        return False

    total_pendiente = sum(pendiente_por_apu.values(), Decimal("0.00"))
    return total_pendiente <= 0


def monto_pendiente_por_apu(reporte, excluir_factura_id=None):
    """
    Devuelve {apu_id: cantidad_pendiente} para todos los APUs del reporte.
    """
    apus = reporte.apus.all()
    apu_ids = [apu.id for apu in apus]
    if not apu_ids:
        return {}

    facturado_qs = (
        FacturaItem.objects.filter(
            apu_id__in=apu_ids,
            factura__estado=EstadoFactura.EMITIDA,
        )
        .values("apu_id")
        .annotate(total=Sum("cantidad"))
    )
    if excluir_factura_id:
        facturado_qs = facturado_qs.exclude(factura_id=excluir_factura_id)

    facturado = {row["apu_id"]: row["total"] for row in facturado_qs}

    pendiente = {}
    for apu in apus:
        ya = facturado.get(apu.id, Decimal("0.00"))
        pendiente[apu.id] = max((apu.cantidad or Decimal("0.00")) - ya, Decimal("0.00"))
    return pendiente