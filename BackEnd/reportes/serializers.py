from rest_framework import serializers
from .models import (
    Cliente,
    Reporte,
    ReporteConfig,
    APU,
    APUMaterial,
    APUHerramienta,
    APUManoObra,
    APULogistica,
    NotaReporte
)
from inventario.models import Stock, Consumible
from inventario.serializers import StockSerializer, ConsumibleSerializer


# ============================================================
# 🧱 MATERIALES
# ============================================================


class APUMaterialSerializer(serializers.ModelSerializer):
    # Datos del inventario (solo lectura)
    stock = StockSerializer(read_only=True)
    consumible = ConsumibleSerializer(read_only=True)

    # IDs para escritura
    stock_id = serializers.PrimaryKeyRelatedField(
        queryset=Stock.objects.all(),
        source="stock",
        write_only=True,
        required=False,
        allow_null=True,
    )
    consumible_id = serializers.PrimaryKeyRelatedField(
        queryset=Consumible.objects.all(),
        source="consumible",
        write_only=True,
        required=False,
        allow_null=True,
    )

    class Meta:
        model = APUMaterial
        fields = [
            "id",
            "apu",
            "stock",
            "stock_id",
            "consumible",
            "consumible_id",
            "descripcion",
            "unidad",
            "cantidad",
            "desperdicio",
            "precio_unitario",
            "total_material",
        ]
        read_only_fields = [
            "descripcion",
            "unidad",
            "precio_unitario",
            "total_material",
        ]


# ============================================================
# 🛠️ HERRAMIENTAS
# ============================================================


class APUHerramientaSerializer(serializers.ModelSerializer):
    class Meta:
        model = APUHerramienta
        fields = [
            "id",
            "apu",
            "descripcion",
            "unidad",
            "cantidad",
            "depreciacion_hora",
            "precio_unitario",
            "total_herramienta",
        ]
        read_only_fields = ["total_herramienta"]


# ============================================================
# 👷 MANO DE OBRA
# ============================================================


class APUManoObraSerializer(serializers.ModelSerializer):
    class Meta:
        model = APUManoObra
        fields = [
            "id",
            "apu",
            "descripcion",
            "unidad",
            "cantidad",
            "precio_unitario",
            "total_mano_obra",
        ]
        read_only_fields = ["total_mano_obra"]


# ============================================================
# 🚚 LOGÍSTICA
# ============================================================


class APULogisticaSerializer(serializers.ModelSerializer):
    class Meta:
        model = APULogistica
        fields = [
            "id",
            "apu",
            "descripcion",
            "unidad",
            "cantidad",
            "precio_unitario",
            "total_logistica",
        ]
        read_only_fields = ["total_logistica"]


# ============================================================
# 🧩 APU SERIALIZER
# ============================================================


class APUSerializer(serializers.ModelSerializer):
    """APU con sus materiales, herramientas, mano de obra y logística."""

    materiales = APUMaterialSerializer(many=True, read_only=True)
    herramientas = APUHerramientaSerializer(many=True, read_only=True)
    manos_obra = APUManoObraSerializer(many=True, read_only=True)
    logisticas = APULogisticaSerializer(many=True, read_only=True)

    class Meta:
        model = APU
        fields = [
            "id",
            "reporte",
            "numero",
            "rendimiento",
            "descripcion",
            "unidad",
            "cantidad",
            "depreciacion",
            "precio_unitario",
            "total_base",
            # Totales por rubro
            "total_materiales",
            "total_herramientas",
            "total_mano_obra",
            "total_logistica",
            # Variables de costos
            "bono_alimenticio",
            "prestaciones_sociales",
            "costo_por_unidad",
            "costo_directo_por_unidad",
            "gastos_administrativos_15",
            "subtotal",
            "utilidad_15",
            "total_apu",
            "fecha_creacion",
            'presupuesto_base',
            'presupuesto_con_desp',
            # Detalle
            "materiales",
            "herramientas",
            "manos_obra",
            "logisticas",
        ]
        read_only_fields = [
            "numero",
            "precio_unitario",
            "total_base",
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
            "fecha_creacion",
        ]


# ============================================================
# 📊 REPORTE SERIALIZER
# ============================================================


class ReporteSerializer(serializers.ModelSerializer):
    """Reporte/presupuesto global con sus APUs."""

    apus = APUSerializer(many=True, read_only=True)
    cliente_nombre = serializers.CharField(source="cliente.nombre", read_only=True)

    class Meta:
        model = Reporte
        fields = [
            "id",
            "n_presupuesto",
            "cliente",
            "cliente_nombre",
            "descripcion",
            "fecha_creacion",
            "total_reporte",
            "apus",
        ]
        read_only_fields = ["n_presupuesto", "fecha_creacion"]


# ============================================================
# 👤 CLIENTE SERIALIZER
# ============================================================


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


# ============================================================
# ⚙️ CONFIGURACIÓN SERIALIZER
# ============================================================


class ReporteConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReporteConfig
        fields = "__all__"


class NotaReporteSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotaReporte
        fields = [
            "id",
            "reporte",       # id del reporte
            "titulo",
            "descripcion",
            "creado_en",
            "actualizado_en",
        ]
        read_only_fields = ["creado_en", "actualizado_en"]