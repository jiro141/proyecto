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


# 🔹 Aquí viene la parte importante
class ProveedorSerializer(serializers.ModelSerializer):
    epps = EPPSerializer(many=True, required=False)
    stocks = StockSerializer(many=True, required=False)
    consumibles = ConsumibleSerializer(many=True, required=False)

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

    def create(self, validated_data):
        epps_data = validated_data.pop("epps", [])
        stocks_data = validated_data.pop("stocks", [])
        consumibles_data = validated_data.pop("consumibles", [])

        # 🔸 Crear el proveedor primero
        proveedor = Proveedor.objects.create(**validated_data)

        # 🔸 Crear EPPs asociados
        for epp in epps_data:
            EPP.objects.create(proveedor=proveedor, **epp)

        # 🔸 Crear Stocks asociados
        for stock in stocks_data:
            Stock.objects.create(proveedor=proveedor, **stock)

        # 🔸 Crear Consumibles asociados
        for cons in consumibles_data:
            Consumible.objects.create(proveedor=proveedor, **cons)

        return proveedor

    def update(self, instance, validated_data):
        # Actualizar los campos básicos del proveedor
        instance.name = validated_data.get("name", instance.name)
        instance.direccion = validated_data.get("direccion", instance.direccion)
        instance.telefono = validated_data.get("telefono", instance.telefono)
        instance.encargado = validated_data.get("encargado", instance.encargado)
        instance.save()

        # Puedes también permitir actualizar artículos si lo deseas
        # (por simplicidad, solo actualizamos proveedor aquí)

        return instance


class MovimientoInventarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = MovimientoInventario
        fields = "__all__"



class TazaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Taza_pesos_dolares
        fields = "__all__"


class TazaPorcentajesSerializer(serializers.ModelSerializer):
    """Serializer específico para actualizar porcentajes de utilidad global."""
    
    class Meta:
        model = Taza_pesos_dolares
        fields = [
            "id",
            "utilidad_porcentaje_1",
            "utilidad_porcentaje_2",
            "utilidad_porcentaje_3",
        ]
    
    def validate_utilidad_porcentaje_1(self, value):
        """Validar que el porcentaje no sea negativo y esté dentro del rango permitido."""
        if value < 0:
            raise serializers.ValidationError(
                "El porcentaje de utilidad 1 no puede ser negativo."
            )
        if value > 999.99:
            raise serializers.ValidationError(
                "El porcentaje de utilidad 1 no puede ser mayor a 999.99."
            )
        return value
    
    def validate_utilidad_porcentaje_2(self, value):
        """Validar que el porcentaje no sea negativo y esté dentro del rango permitido."""
        if value < 0:
            raise serializers.ValidationError(
                "El porcentaje de utilidad 2 no puede ser negativo."
            )
        if value > 999.99:
            raise serializers.ValidationError(
                "El porcentaje de utilidad 2 no puede ser mayor a 999.99."
            )
        return value
    
    def validate_utilidad_porcentaje_3(self, value):
        """Validar que el porcentaje no sea negativo y esté dentro del rango permitido."""
        if value < 0:
            raise serializers.ValidationError(
                "El porcentaje de utilidad 3 no puede ser negativo."
            )
        if value > 999.99:
            raise serializers.ValidationError(
                "El porcentaje de utilidad 3 no puede ser mayor a 999.99."
            )
        return value