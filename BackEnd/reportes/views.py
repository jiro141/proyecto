from rest_framework import generics, filters, status
from .models import Cliente, Reporte, ReporteConfig
from .serializers import ClienteSerializer, ReporteSerializer, ReporteConfigSerializer
from rest_framework.response import Response


# ========================
#  CLIENTE
# ========================
class ClienteListCreateView(generics.ListCreateAPIView):
    """Lista y crea clientes. Permite búsqueda por nombre o encargado."""

    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["nombre", "encargado", "rif"]


class ClienteDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Obtiene, actualiza o elimina un cliente específico."""

    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer


# ========================
#  REPORTE
# ========================
class ReporteListCreateView(generics.ListCreateAPIView):
    """Lista y crea reportes."""

    queryset = Reporte.objects.all().select_related("cliente")
    serializer_class = ReporteSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = [
        "n_control",
        "cliente__nombre",
        "cliente__rif",
        "cliente__encargado",
    ]


class ReporteDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Obtiene, actualiza o elimina un reporte."""

    queryset = Reporte.objects.all()
    serializer_class = ReporteSerializer


# ========================
#  CONFIGURACIÓN
# ========================
class ReporteConfigView(generics.RetrieveUpdateAPIView):
    """
    ✅ Permite ver (GET), actualizar (PUT) y crear/actualizar (POST)
    Si no existe la configuración, devuelve 404 sin crear nada.
    """

    queryset = ReporteConfig.objects.all()
    serializer_class = ReporteConfigSerializer

    def get_object(self):
        # ❌ Antes: get_or_create — creaba automáticamente
        # ✅ Ahora: solo intenta obtener, sin crear
        try:
            return ReporteConfig.objects.get(id=1)
        except ReporteConfig.DoesNotExist:
            return None

    def get(self, request, *args, **kwargs):
        config = self.get_object()
        if not config:
            return Response(
                {"detail": "No existe configuración de reportes."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = self.get_serializer(config)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, *args, **kwargs):
        """
        ✅ Crea o actualiza el número de control manualmente.
        """
        config = self.get_object()
        if config:
            serializer = self.get_serializer(config, data=request.data, partial=True)
        else:
            serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
