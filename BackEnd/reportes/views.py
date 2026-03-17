from django.db.models import Sum, Case, When, IntegerField, Value
from django.db.models.functions import Coalesce, TruncMonth
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from inventario.models import MovimientoInventario
from .serializers import (
    ReporteMovimientoProductoSerializer,
    ReporteMensualSerializer,
)


class ReportePorProductoView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        movimientos = (
            MovimientoInventario.objects.select_related("stock")
            .values("stock__id", "stock__codigo", "stock__descripcion")
            .annotate(
                entradas=Coalesce(
                    Sum(
                        Case(
                            When(tipo="entrada", then="cantidad"),
                            default=Value(0),
                            output_field=IntegerField(),
                        )
                    ),
                    0,
                ),
                salidas=Coalesce(
                    Sum(
                        Case(
                            When(tipo="salida", then="cantidad"),
                            default=Value(0),
                            output_field=IntegerField(),
                        )
                    ),
                    0,
                ),
                ajustes=Coalesce(
                    Sum(
                        Case(
                            When(tipo="ajuste", then="cantidad"),
                            default=Value(0),
                            output_field=IntegerField(),
                        )
                    ),
                    0,
                ),
            )
            .order_by("stock__descripcion")
        )

        data = []
        for item in movimientos:
            data.append(
                {
                    "stock_id": item["stock__id"],
                    "codigo": item["stock__codigo"],
                    "descripcion": item["stock__descripcion"],
                    "entradas": item["entradas"],
                    "salidas": item["salidas"],
                    "ajustes": item["ajustes"],
                    "total_movimientos": item["entradas"] + item["salidas"] + item["ajustes"],
                }
            )

        serializer = ReporteMovimientoProductoSerializer(data, many=True)
        return Response(serializer.data)


class ReporteMensualView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        movimientos = (
            MovimientoInventario.objects.annotate(mes=TruncMonth("fecha"))
            .values("mes")
            .annotate(
                entradas=Coalesce(
                    Sum(
                        Case(
                            When(tipo="entrada", then="cantidad"),
                            default=Value(0),
                            output_field=IntegerField(),
                        )
                    ),
                    0,
                ),
                salidas=Coalesce(
                    Sum(
                        Case(
                            When(tipo="salida", then="cantidad"),
                            default=Value(0),
                            output_field=IntegerField(),
                        )
                    ),
                    0,
                ),
                ajustes=Coalesce(
                    Sum(
                        Case(
                            When(tipo="ajuste", then="cantidad"),
                            default=Value(0),
                            output_field=IntegerField(),
                        )
                    ),
                    0,
                ),
            )
            .order_by("-mes")
        )

        data = [
            {
                "mes": item["mes"].strftime("%Y-%m") if item["mes"] else "",
                "entradas": item["entradas"],
                "salidas": item["salidas"],
                "ajustes": item["ajustes"],
            }
            for item in movimientos
        ]

        serializer = ReporteMensualSerializer(data, many=True)
        return Response(serializer.data)
