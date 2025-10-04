from rest_framework import serializers
from .models import *


class LugarConsumoSerializer(serializers.ModelSerializer):
    class Meta:
        model = LugarConsumo
        fields = "__all__"


class UbicacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ubicacion
        fields = "__all__"


class DepartamentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Departamento
        fields = "__all__"


class EPPSerializer(serializers.ModelSerializer):
    class Meta:
        model = EPP
        fields = "__all__"


class StockSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stock
        fields = "__all__"


class ConsumibleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Consumible
        fields = "__all__"


class ProveedorSerializer(serializers.ModelSerializer):
    epps = EPPSerializer(many=True, read_only=True)
    stocks = StockSerializer(many=True, read_only=True)
    consumibles = ConsumibleSerializer(many=True, read_only=True)

    class Meta:
        model = Proveedor
        fields = [
            "id",
            "name",
            "direccion",
            "telefono",
            "encargado",
            "epps",
            "stocks",
            "consumibles",
        ]


class MovimientoInventarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = MovimientoInventario
        fields = "__all__"
