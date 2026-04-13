from django.shortcuts import render
from django.db.models import Sum, Count, Q

from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Abono
from .serializers import AbonoSerializer
from reportes.models import EstadoChoices


class AbonoViewSet(viewsets.ModelViewSet):
    queryset = Abono.objects.all()
    serializer_class = AbonoSerializer

    def get_queryset(self):
        qs = Abono.objects.filter(
            reporte__estado=EstadoChoices.EJECUTADO
        ).select_related('reporte', 'reporte__cliente')

        # Filtros por fecha
        fecha_desde = self.request.query_params.get('fecha_desde')
        fecha_hasta = self.request.query_params.get('fecha_hasta')

        if fecha_desde:
            qs = qs.filter(fecha_abono__date__gte=fecha_desde)
        if fecha_hasta:
            qs = qs.filter(fecha_abono__date__lte=fecha_hasta)

        return qs

    @action(detail=False, methods=['get'])
    def resumen(self):
        """
        Endpoint para obtener resumen de cuentas por cobrar en un rango de fechas.
        Parameters: fecha_desde, fecha_hasta
        """
        request = self.request
        fecha_desde = request.query_params.get('fecha_desde')
        fecha_hasta = request.query_params.get('fecha_hasta')

        # Base query
        qs = Abono.objects.filter(
            reporte__estado=EstadoChoices.EJECUTADO
        ).select_related('reporte', 'reporte__cliente')

        if fecha_desde:
            qs = qs.filter(fecha_abono__date__gte=fecha_desde)
        if fecha_hasta:
            qs = qs.filter(fecha_abono__date__lte=fecha_hasta)

        # Agrupar por reporte
        abonos_agrupados = qs.values(
            'reporte__id',
            'reporte__n_presupuesto',
            'reporte__descripcion',
            'reporte__cliente__nombre',
            'reporte__total_reporte'
        ).annotate(
            total_abonado=Sum('monto'),
            cantidad_abonos=Count('id')
        ).order_by('-fecha_abono')

        # Calcular totales
        total_facturado = sum(item['reporte__total_reporte'] for item in abonos_agrupados)
        total_abonado = sum(item['total_abonado'] or 0 for item in abonos_agrupados)
        total_pendiente = total_facturado - total_abonado

        return Response({
            'detalle': list(abonos_agrupados),
            'totales': {
                'total_facturado': total_facturado,
                'total_abonado': total_abonado,
                'total_pendiente': total_pendiente
            }
        })