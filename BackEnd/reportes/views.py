from rest_framework import generics, filters, status
from rest_framework.response import Response
from django.http import Http404
from .models import Cliente, Reporte, ReporteConfig
from .serializers import ClienteSerializer, ReporteSerializer, ReporteConfigSerializer


# ========================
#  CLIENTE
# ========================
class ClienteListCreateView(generics.ListCreateAPIView):
    """Lista y crea clientes. Permite búsqueda por nombre, encargado o RIF."""
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
#  CONFIGURACIÓN DE REPORTES
# ========================
class ReporteConfigView(generics.GenericAPIView):
    """
    Permite ver (GET) y crear/actualizar (POST) la configuración de reportes.
    Siempre trabaja sobre el primer registro existente.
    """
    queryset = ReporteConfig.objects.all()
    serializer_class = ReporteConfigSerializer

    def get_object(self):
        """Obtiene la primera configuración disponible."""
        config = ReporteConfig.objects.first()
        if not config:
            return None
        return config

    def get(self, request, *args, **kwargs):
        """Devuelve la configuración si existe, o 404 si no."""
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
        Crea o actualiza la configuración de reportes.
        Si existe, actualiza parcialmente; si no, crea una nueva.
        """
        config = self.get_object()
        if config:
            serializer = self.get_serializer(config, data=request.data, partial=True)
        else:
            serializer = self.get_serializer(data=request.data)

        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
