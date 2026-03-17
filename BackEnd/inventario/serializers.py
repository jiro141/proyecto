from rest_framework import serializers
from .models import (
    Departamento,
    Stock,
    Proveedor,
    MovimientoInventario,
    Taza_pesos_dolares,
)


class DepartamentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Departamento
        fields = "__all__"


class StockSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stock
        fields = "__all__"


class ProveedorSerializer(serializers.ModelSerializer):
    stocks = StockSerializer(many=True, required=False)

    class Meta:
        model = Proveedor
        fields = [
            "id",
            "name",
            "direccion",
            "telefono",
            "encargado",
            "stocks",
        ]

    def create(self, validated_data):
        stocks_data = validated_data.pop("stocks", [])
        proveedor = Proveedor.objects.create(**validated_data)

        for stock_data in stocks_data:
            Stock.objects.create(proveedor=proveedor, **stock_data)

        return proveedor

    def update(self, instance, validated_data):
        stocks_data = validated_data.pop("stocks", None)

        instance.name = validated_data.get("name", instance.name)
        instance.direccion = validated_data.get("direccion", instance.direccion)
        instance.telefono = validated_data.get("telefono", instance.telefono)
        instance.encargado = validated_data.get("encargado", instance.encargado)
        instance.save()

        # Si quieres actualizar stocks aquí, este bloque los reemplaza completos
        if stocks_data is not None:
            instance.stocks.all().delete()
            for stock_data in stocks_data:
                Stock.objects.create(proveedor=instance, **stock_data)

        return instance


class MovimientoInventarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = MovimientoInventario
        fields = "__all__"


class TazaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Taza_pesos_dolares
        fields = "__all__"