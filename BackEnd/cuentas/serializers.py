from rest_framework import serializers
from .models import Abono

class AbonoSerializer(serializers.ModelSerializer):
    # Campo de solo lectura para mostrar la descripción sin pedirla al crear
    descripcion_reporte = serializers.ReadOnlyField(source='reporte.descripcion')
    n_presupuesto = serializers.ReadOnlyField(source='reporte.n_presupuesto')

    class Meta:
        model = Abono
        fields = [
            'id', 
            'reporte', 
            'n_presupuesto',
            'monto', 
            'referencia_pago', 
            'fecha_abono', 
            'descripcion_reporte'
        ]