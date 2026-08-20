from decimal import Decimal

from django.db import models
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from reportes.models import Reporte, EstadoChoices
from .models import Factura, FacturaItem, FacturaConfig, EstadoFactura
from .serializers import FacturaSerializer, FacturaConfigSerializer
from .services import (
    validar_reporte_facturable,
    monto_pendiente_por_apu,
    reporte_facturado_completo,
    proximo_n_factura,
    monto_facturado_reporte,
    total_base_sin_descuento,
    restante_facturacion,
)


# ============================================================
# 🧾 FACTURAS
# ============================================================


class FacturaListCreateView(generics.ListCreateAPIView):
    """
    GET: lista facturas (búsqueda por n_factura o cliente).
    POST: crea una factura (items anidados + validaciones de negocio).
    """

    serializer_class = FacturaSerializer

    def get_queryset(self):
        qs = Factura.objects.select_related(
            "reporte", "reporte__cliente"
        ).prefetch_related("items")

        search = self.request.query_params.get("search", "")
        reporte_id = self.request.query_params.get("reporte_id")
        if reporte_id:
            qs = qs.filter(reporte_id=reporte_id)
        if search:
            qs = qs.filter(
                models.Q(n_factura__icontains=search)
                | models.Q(orden_control__icontains=search)
                | models.Q(cliente_nombre__icontains=search)
                | models.Q(cliente_rif__icontains=search)
            )
        return qs

    def create(self, request, *args, **kwargs):
        import copy

        data = copy.deepcopy(request.data)
        items_data = data.pop("items", [])
        # Parsea el flag de forma robusta: la frontend envía JSON booleano, pero
        # otros clientes pueden enviarlo como string ("true"/"false"/"1").
        # bool("false") sería True (string no vacío), así que NO usar bool().
        factura_completa = str(data.pop("factura_completa", False)).strip().lower() in (
            "true",
            "1",
            "on",
            "yes",
        )

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.context["items_data"] = items_data
        serializer.context["factura_completa"] = factura_completa

        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class FacturaDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET: detalle de la factura.
    PUT/PATCH: edita una factura EMITIDA (items reemplazables).
    DELETE: anula una factura EMITIDA (liberando el pendiente).
    """

    queryset = Factura.objects.select_related(
        "reporte", "reporte__cliente"
    ).prefetch_related("items")
    serializer_class = FacturaSerializer

    def update(self, request, *args, **kwargs):
        import copy

        partial = kwargs.pop("partial", False)
        instance = self.get_object()

        if instance.estado != EstadoFactura.EMITIDA:
            return Response(
                {"detail": "Solo se pueden editar facturas en estado Emitida."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = copy.deepcopy(request.data)
        items_data = data.pop("items", [])

        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.context["items_data"] = items_data

        self.perform_update(serializer)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        """Anular factura: EMITIDA → ANULADA (libera el pendiente)."""
        instance = self.get_object()

        if instance.estado == EstadoFactura.ANULADA:
            return Response(
                {"detail": "La factura ya está anulada."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        instance.estado = EstadoFactura.ANULADA
        instance.save(update_fields=["estado", "updated_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class AnularFacturaView(APIView):
    """POST /facturas/<pk>/anular/ — anula una factura EMITIDA."""

    def post(self, request, pk):
        factura = get_object_or_404(Factura, pk=pk)

        if factura.estado == EstadoFactura.ANULADA:
            return Response(
                {"detail": "La factura ya está anulada."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        factura.estado = EstadoFactura.ANULADA
        factura.save(update_fields=["estado", "updated_at"])
        serializer = FacturaSerializer(factura)
        return Response(serializer.data)


# ============================================================
# 📋 PRESUPUESTOS DISPONIBLES PARA FACTURAR
# ============================================================


class PresupuestosDisponiblesView(APIView):
    """
    GET: lista de presupuestos EJECUTADO con su estado de facturación.
    Cada item incluye `facturado_completo` (bool) y `pendiente_cantidad`.
    """

    def get(self, request):
        reportes = (
            Reporte.objects.filter(estado=EstadoChoices.EJECUTADO)
            .select_related("cliente")
            .prefetch_related("apus")
        )

        resultado = []
        for reporte in reportes:
            # Mapa apu_id -> pendiente por facturar (una sola consulta por reporte)
            pendiente_map = monto_pendiente_por_apu(reporte)
            facturado_completo = reporte_facturado_completo(
                reporte, pendiente_por_apu=pendiente_map
            )

            pendiente_total = sum(
                (pendiente_map.get(apu.id, Decimal("0.00")) for apu in reporte.apus.all()),
                Decimal("0.00"),
            )
            if facturado_completo:
                pendiente_total = Decimal("0.00")

            resultado.append(
                {
                    "id": reporte.id,
                    "n_presupuesto": reporte.n_presupuesto,
                    "cliente_id": reporte.cliente_id,
                    "cliente_nombre": reporte.cliente.nombre,
                    "cliente_rif": reporte.cliente.rif,
                    "descripcion": reporte.descripcion,
                    "total_reporte": reporte.total_reporte,
                    "pendiente_cantidad": pendiente_total.quantize(Decimal("0.01")),
                    "facturado_completo": facturado_completo,
                    "estado": reporte.estado,
                    "estado_display": reporte.get_estado_display(),
                    "fecha_creacion": reporte.fecha_creacion.isoformat(),
                }
            )

        return Response(resultado)


class PendienteFacturaView(APIView):
    """
    GET /facturas/presupuestos/<reporte_id>/pendiente/
    Devuelve los APUs del presupuesto con su cantidad, cantidad ya facturada
    y cantidad pendiente por facturar (solo para presupuestos EJECUTADO).
    """

    def get(self, request, reporte_id):
        reporte = get_object_or_404(
            Reporte.objects.filter(estado=EstadoChoices.EJECUTADO),
            pk=reporte_id,
        )

        apus = reporte.apus.all().order_by("numero")
        pendiente_map = monto_pendiente_por_apu(reporte)

        data = []
        for apu in apus:
            pendiente = pendiente_map.get(apu.id, Decimal("0.00"))
            data.append(
                {
                    "apu_id": apu.id,
                    "numero": apu.numero,
                    "descripcion": apu.descripcion,
                    "unidad": apu.unidad,
                    "cantidad": apu.cantidad,
                    "cantidad_facturada": (apu.cantidad - pendiente).quantize(Decimal("0.01")),
                    "cantidad_pendiente": pendiente.quantize(Decimal("0.01")),
                    "precio_unitario": apu.precio_unitario,
                }
            )

        return Response(
            {
                "reporte_id": reporte.id,
                "n_presupuesto": reporte.n_presupuesto,
                "cliente_id": reporte.cliente_id,
                "cliente_nombre": reporte.cliente.nombre,
                "total_reporte": reporte.total_reporte,
                "total_base_sin_descuento": total_base_sin_descuento(reporte).quantize(
                    Decimal("0.01")
                ),
                "monto_facturado": monto_facturado_reporte(reporte).quantize(
                    Decimal("0.01")
                ),
                "restante_facturacion": restante_facturacion(reporte).quantize(
                    Decimal("0.01")
                ),
                "apus": data,
            }
        )


# ============================================================
# ⚙️ CONFIGURACIÓN DE FACTURAS
# ============================================================


class FacturaConfigView(APIView):
    """
    GET: configuración + siguiente n_factura (Serie-NNNN).
    POST: crea/actualiza la configuración (serie, punto de inicio).
    """

    def get(self, request):
        config = FacturaConfig.objects.first()
        if not config:
            return Response(
                {"detail": "No existe configuración de facturas."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = FacturaConfigSerializer(config)
        data = serializer.data
        data["siguiente_n_factura"] = proximo_n_factura()
        return Response(data)

    def post(self, request):
        serializer = FacturaConfigSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        config, _ = FacturaConfig.objects.update_or_create(
            id=1, defaults=serializer.validated_data
        )
        data = FacturaConfigSerializer(config).data
        data["siguiente_n_factura"] = proximo_n_factura()
        return Response(data, status=status.HTTP_201_CREATED)