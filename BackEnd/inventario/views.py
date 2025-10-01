from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import *
from .serializers import *

class LugarConsumoViewSet(viewsets.ModelViewSet):
    queryset = LugarConsumo.objects.all()
    serializer_class = LugarConsumoSerializer
    permission_classes = [IsAuthenticated]

class UbicacionViewSet(viewsets.ModelViewSet):
    queryset = Ubicacion.objects.all()
    serializer_class = UbicacionSerializer
    permission_classes = [IsAuthenticated]

class DepartamentoViewSet(viewsets.ModelViewSet):
    queryset = Departamento.objects.all()
    serializer_class = DepartamentoSerializer
    permission_classes = [IsAuthenticated]

class EPPViewSet(viewsets.ModelViewSet):
    queryset = EPP.objects.all()
    serializer_class = EPPSerializer
    permission_classes = [IsAuthenticated]

class StockViewSet(viewsets.ModelViewSet):
    queryset = Stock.objects.all()
    serializer_class = StockSerializer
    permission_classes = [IsAuthenticated]

class ConsumibleViewSet(viewsets.ModelViewSet):
    queryset = Consumible.objects.all()
    serializer_class = ConsumibleSerializer
    permission_classes = [IsAuthenticated]

class ProveedorViewSet(viewsets.ModelViewSet):
    queryset = Proveedor.objects.all()
    serializer_class = ProveedorSerializer
    permission_classes = [IsAuthenticated]
    
class MovimientoInventarioViewSet(viewsets.ModelViewSet):
    queryset = MovimientoInventario.objects.all()
    serializer_class = MovimientoInventarioSerializer
    permission_classes = [IsAuthenticated]
