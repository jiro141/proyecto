from rest_framework import serializers
from .models import Abono

class AbonoSerializer(serializers.ModelSerializer):
    # Traemos datos directamente del modelo Reporte relacionado
    monto_total_reporte = serializers.ReadOnlyField(source='reporte.total_reporte')
    descripcion_reporte = serializers.ReadOnlyField(source='reporte.descripcion')
    n_presupuesto = serializers.ReadOnlyField(source='reporte.n_presupuesto')
    
    # Campo calculado para el restante
    monto_restante = serializers.SerializerMethodField()

    class Meta:
        model = Abono
        fields = [
            'id', 
            'reporte', 
            'n_presupuesto',
            'monto_total_reporte', # El total de la "factura"
            'monto',               # Lo que se está abonando ahora
            'monto_restante',      # Lo que queda pendiente
            'referencia_pago', 
            'fecha_abono', 
            'descripcion_reporte'
        ]

    def get_monto_restante(self, obj):
        """
        Utiliza la propiedad que definimos en el modelo Reporte 
        para obtener el saldo después de todos los abonos.
        """
        return obj.reporte.saldo_pendiente