from rest_framework import serializers


class ReporteMovimientoProductoSerializer(serializers.Serializer):
    stock_id = serializers.IntegerField()
    codigo = serializers.CharField()
    descripcion = serializers.CharField()
    entradas = serializers.IntegerField()
    salidas = serializers.IntegerField()
    ajustes = serializers.IntegerField()
    total_movimientos = serializers.IntegerField()


class ReporteMensualSerializer(serializers.Serializer):
    mes = serializers.CharField()
    entradas = serializers.IntegerField()
    salidas = serializers.IntegerField()
    ajustes = serializers.IntegerField()