from rest_framework import serializers
from .models import Cliente, Reporte, ReporteConfig
from inventario.serializers import StockSerializer, ConsumibleSerializer, EPPSerializer


# ==========================
# SERIALIZADOR DE REPORTE
# ==========================

class ReporteSerializer(serializers.ModelSerializer):
    stock_almacen = StockSerializer(many=True, read_only=True)
    stock_comprar = StockSerializer(many=True, read_only=True)
    consumibles = ConsumibleSerializer(many=True, read_only=True)
    epps = EPPSerializer(many=True, read_only=True)

    class Meta:
        model = Reporte
        fields = [
            "id",
            "n_control",
            "fecha",
            "presupuesto_estimado",
            "porcentaje_productividad",
            "lugar",
            "fecha_estimacion_culminacion",
            "aprobado",
            "observaciones",
            "stock_almacen",
            "stock_comprar",
            "consumibles",
            "epps",
        ]
        read_only_fields = ("n_control",)  # ✅ aquí es donde corresponde


# ==========================
# SERIALIZADOR DE CLIENTE
# ==========================

class ClienteSerializer(serializers.ModelSerializer):
    reportes = ReporteSerializer(many=True, read_only=True)

    class Meta:
        model = Cliente
        fields = [
            "id",
            "nombre",
            "rif",
            "encargado",
            "telefono",
            "direccion",
            "correo_electronico",
            "reportes",
        ]


# ==========================
# SERIALIZADOR DE CONFIGURACIÓN
# ==========================

class ReporteConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReporteConfig
        fields = "__all__"
