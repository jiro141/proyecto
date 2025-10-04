from rest_framework import serializers
from .models import Cliente, Reporte, ReporteConfig


class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = "__all__"


class ReporteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reporte
        fields = "__all__"
        read_only_fields = ("n_control",)  # el número se genera automático


class ReporteConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReporteConfig
        fields = "__all__"
