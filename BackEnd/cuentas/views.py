from django.shortcuts import render

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
        # Solo mostrar abonos de reportes en estado EJECUTADO
        return Abono.objects.filter(
            reporte__estado=EstadoChoices.EJECUTADO
        ).select_related('reporte', 'reporte__cliente')