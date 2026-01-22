from rest_framework import viewsets, filters, generics, status
from rest_framework.permissions import IsAuthenticated
from .models import *
from .serializers import *
from rest_framework.response import Response


class LugarConsumoViewSet(viewsets.ModelViewSet):
    queryset = LugarConsumo.objects.all().order_by("id")
    serializer_class = LugarConsumoSerializer
    permission_classes = [IsAuthenticated]


class UbicacionViewSet(viewsets.ModelViewSet):
    queryset = Ubicacion.objects.all().order_by("id")
    serializer_class = UbicacionSerializer
    permission_classes = [IsAuthenticated]


class DepartamentoViewSet(viewsets.ModelViewSet):
    queryset = Departamento.objects.all().order_by("id")
    serializer_class = DepartamentoSerializer
    permission_classes = [IsAuthenticated]
    # 🔍 Habilitar búsqueda dinámica en el endpoint
    filter_backends = [filters.SearchFilter]
    search_fields = ["name"]


class EPPViewSet(viewsets.ModelViewSet):
    queryset = EPP.objects.all().order_by("-item_fijo", "name")
    serializer_class = EPPSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ["name"]


class StockViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar los ítems de inventario (Stock).
    Los ítems fijos (`item_fijo=True`) siempre se muestran primero.
    """

    queryset = Stock.objects.all().order_by("-item_fijo", "descripcion")
    serializer_class = StockSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ["codigo", "descripcion"]


class ConsumibleViewSet(viewsets.ModelViewSet):
    queryset = Consumible.objects.all().order_by("-item_fijo", "descripcion")
    serializer_class = ConsumibleSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ["descripcion", "codigo", "unidad"]


class ProveedorViewSet(viewsets.ModelViewSet):
    queryset = Proveedor.objects.all().order_by("id")
    serializer_class = ProveedorSerializer
    permission_classes = [IsAuthenticated]
    # 🔍 Agregamos soporte para búsqueda dinámica
    filter_backends = [filters.SearchFilter]
    search_fields = ["name", "encargado"]  # campos donde buscar


class MovimientoInventarioViewSet(viewsets.ModelViewSet):
    queryset = MovimientoInventario.objects.all().order_by("id").order_by("-fecha")
    serializer_class = MovimientoInventarioSerializer
    permission_classes = [IsAuthenticated]


class TazaViewSet(viewsets.ViewSet):
    """
    Maneja GET y POST sobre una única tasa global (solo un registro).
    """

    def list(self, request):
        tasa = Taza_pesos_dolares.objects.first()
        if not tasa:
            return Response(
                {"detail": "No existe tasa registrada."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = TazaSerializer(tasa)
        return Response(serializer.data)

    def create(self, request):
        tasa = Taza_pesos_dolares.objects.first()
        if tasa:
            serializer = TazaSerializer(tasa, data=request.data, partial=True)
        else:
            serializer = TazaSerializer(data=request.data)

        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
