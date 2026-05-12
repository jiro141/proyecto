from django.shortcuts import render
from django.db.models import Sum, Count, Q
from django.db.models.functions import Coalesce

from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Abono
from .serializers import AbonoSerializer
from reportes.models import EstadoChoices, Cliente, Reporte


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

    @action(detail=False, methods=['get'], url_path='resumen-cuentas')
    def resumen_cuentas(self, request):
        """
        Endpoint para obtener resumen de cuentas por cobrar en un rango de fechas.
        Parameters: fecha_desde, fecha_hasta
        """
        try:
            fecha_desde = request.query_params.get('fecha_desde')
            fecha_hasta = request.query_params.get('fecha_hasta')

            # Obtener TODOS los reportes ejecutados (no solo los que tienen abonos)
            reportes_qs = Reporte.objects.filter(
                estado=EstadoChoices.EJECUTADO
            ).select_related('cliente').prefetch_related('abonos')

            # Filtrar por fecha de creación del reporte si se especifica
            if fecha_desde:
                reportes_qs = reportes_qs.filter(fecha_creacion__date__gte=fecha_desde)
            if fecha_hasta:
                reportes_qs = reportes_qs.filter(fecha_creacion__date__lte=fecha_hasta)

            detalle = []
            total_facturado = 0
            total_abonado = 0

            for reporte in reportes_qs:
                try:
                    # Calcular total abonado con manejo defensivo
                    abonos_total = reporte.abonos.aggregate(total=Sum('monto'))['total']
                    abonado = float(abonos_total) if abonos_total else 0
                    
                    # Manejar total_reporte defensivamente
                    total_rep = float(reporte.total_reporte) if reporte.total_reporte else 0
                    pendiente = total_rep - abonado
                    
                    # Nombre del cliente defensivo
                    nombre_cliente = ''
                    if reporte.cliente:
                        try:
                            nombre_cliente = reporte.cliente.nombre or ''
                        except Exception:
                            pass
                    
                    detalle.append({
                        'reporte__id': reporte.id,
                        'reporte__n_presupuesto': reporte.n_presupuesto or '',
                        'reporte__descripcion': reporte.descripcion or '',
                        'reporte__cliente__nombre': nombre_cliente,
                        'reporte__total_reporte': total_rep,
                        'reporte__fecha_creacion': reporte.fecha_creacion.isoformat() if reporte.fecha_creacion else None,
                        'total_abonado': abonado,
                        'cantidad_abonos': reporte.abonos.count(),
                    })
                    
                    total_facturado += total_rep
                    total_abonado += abonado
                except Exception as e:
                    # Skip problematic reports but log
                    print(f"Error processing reporte {reporte.id}: {e}")
                    continue

            total_pendiente = total_facturado - total_abonado

            return Response({
                'detalle': detalle,
                'totales': {
                    'total_facturado': total_facturado,
                    'total_abonado': total_abonado,
                    'total_pendiente': total_pendiente
                }
            })
        except Exception as e:
            import traceback
            return Response({'error': str(e), 'trace': traceback.format_exc()}, status=500)

    @action(detail=False, methods=['get'])
    def por_cliente(self, request):
        """
        Endpoint para obtener resumen de cuentas por cobrar agrupadas por cliente.
        Ahora incluye TODOS los reportes ejecutados (no solo los pendientes) y sus abonos.
        """
        # Obtener reportes ejecutados
        reportes_qs = Reporte.objects.filter(
            estado=EstadoChoices.EJECUTADO
        ).select_related('cliente').prefetch_related('abonos')

        # Agrupar por cliente
        clientes_data = {}

        for reporte in reportes_qs:
            cliente = reporte.cliente
            cliente_id = cliente.id

            if cliente_id not in clientes_data:
                clientes_data[cliente_id] = {
                    'cliente': {
                        'id': cliente.id,
                        'nombre': cliente.nombre,
                        'rif': cliente.rif,
                        'telefono': cliente.telefono,
                        'direccion': cliente.direccion,
                    },
                    'reportes': [],
                    'total_facturado': 0,
                    'total_abonado': 0,
                    'total_pendiente': 0,
                }

            # Calcular abonado del reporte
            abonado = reporte.abonos.aggregate(total=Sum('monto'))['total'] or 0
            pendiente = reporte.total_reporte - abonado

            # Obtener lista de abonos del reporte
            abonos_list = list(reporte.abonos.values(
                'id', 'monto', 'referencia_pago', 'fecha_abono'
            ).order_by('-fecha_abono'))

            # MOSTRAR TODOS los reportes ejecutados (no solo los pendientes)
            clientes_data[cliente_id]['reportes'].append({
                'id': reporte.id,
                'n_presupuesto': reporte.n_presupuesto,
                'descripcion': reporte.descripcion,
                'total': float(reporte.total_reporte),
                'abonado': float(abonado),
                'pendiente': float(pendiente),
                'estado': reporte.estado,
                'fecha_creacion': reporte.fecha_creacion.isoformat() if reporte.fecha_creacion else None,
                'abonos': abonos_list,  # Incluir abonos en cada reporte
            })
            clientes_data[cliente_id]['total_facturado'] += float(reporte.total_reporte)
            clientes_data[cliente_id]['total_abonado'] += float(abonado)
            clientes_data[cliente_id]['total_pendiente'] += float(pendiente)

        # Calcular totales globales
        total_facturado = sum(c['total_facturado'] for c in clientes_data.values())
        total_abonado = sum(c['total_abonado'] for c in clientes_data.values())
        total_pendiente = sum(c['total_pendiente'] for c in clientes_data.values())

        # Ordenar por mayor pendiente
        clientes_ordenados = sorted(
            clientes_data.values(),
            key=lambda x: x['total_pendiente'],
            reverse=True
        )

        return Response({
            'clientes': clientes_ordenados,
            'totales': {
                'total_facturado': total_facturado,
                'total_abonado': total_abonado,
                'total_pendiente': total_pendiente
            }
        })

    @action(detail=False, methods=['get'])
    def cliente_detail(self, request):
        """
        Endpoint para obtener detalle de cuentas de un cliente específico.
        Query params: cliente_id
        """
        cliente_id = request.query_params.get('cliente_id')

        if not cliente_id:
            return Response(
                {'error': 'Se requiere cliente_id como parámetro'},
                status=400
            )

        try:
            cliente = Cliente.objects.get(id=cliente_id)
        except Cliente.DoesNotExist:
            return Response(
                {'error': 'Cliente no encontrado'},
                status=404
            )

        # Obtener reportes del cliente
        reportes_qs = Reporte.objects.filter(
            cliente=cliente,
            estado__in=[EstadoChoices.EJECUTADO, EstadoChoices.APROBADO_ESPERA]
        ).prefetch_related('abonos').order_by('-fecha_creacion')

        reportes_data = []
        total_facturado = 0
        total_abonado = 0
        total_pendiente = 0

        for reporte in reportes_qs:
            abonado = reporte.abonos.aggregate(total=Sum('monto'))['total'] or 0
            pendiente = reporte.total_reporte - abonado

            # Obtener abonos del reporte
            abonos_list = list(reporte.abonos.values(
                'id', 'monto', 'referencia_pago', 'fecha_abono'
            ).order_by('-fecha_abono'))

            reportes_data.append({
                'id': reporte.id,
                'n_presupuesto': reporte.n_presupuesto,
                'descripcion': reporte.descripcion,
                'total': float(reporte.total_reporte),
                'abonado': float(abonado),
                'pendiente': float(pendiente),
                'estado': reporte.estado,
                'fecha_creacion': reporte.fecha_creacion.isoformat() if reporte.fecha_creacion else None,
                'abonos': abonos_list,
            })
            total_facturado += float(reporte.total_reporte)
            total_abonado += float(abonado)
            total_pendiente += float(pendiente)

        return Response({
            'cliente': {
                'id': cliente.id,
                'nombre': cliente.nombre,
                'rif': cliente.rif,
                'encargado': cliente.encargado,
                'telefono': cliente.telefono,
                'direccion': cliente.direccion,
                'correo_electronico': cliente.correo_electronico,
            },
            'reportes': reportes_data,
            'totales': {
                'total_facturado': total_facturado,
                'total_abonado': total_abonado,
                'total_pendiente': total_pendiente
            }
        })