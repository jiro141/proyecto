from rest_framework import generics
from .models import Cliente, Reporte, ReporteConfig
from .serializers import ClienteSerializer, ReporteSerializer, ReporteConfigSerializer


# ========================
#  CLIENTE
# ========================
class ClienteListCreateView(generics.ListCreateAPIView):
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer


class ClienteDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer


# ========================
#  REPORTE
# ========================
class ReporteListCreateView(generics.ListCreateAPIView):
    queryset = Reporte.objects.all()
    serializer_class = ReporteSerializer


class ReporteDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Reporte.objects.all()
    serializer_class = ReporteSerializer


# ========================
#  CONFIGURACIÓN
# ========================
class ReporteConfigView(generics.RetrieveUpdateAPIView):
    """Permite ver y editar el punto de inicio de los reportes"""
    queryset = ReporteConfig.objects.all()
    serializer_class = ReporteConfigSerializer

    def get_object(self):
        # siempre devuelve la primera config
        obj, created = ReporteConfig.objects.get_or_create(id=1, defaults={"punto_inicio": 1})
        return obj
