from rest_framework import generics, filters, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

from .models import (
    Cliente,
    Reporte,
    ReporteConfig,
    APU,
    APUMaterial,
    APUHerramienta,
    APUManoObra,
    APULogistica,
    NotaReporte,
)
from .serializers import (
    ClienteSerializer,
    ReporteSerializer,
    ReporteConfigSerializer,
    APUSerializer,
    APUMaterialSerializer,
    APUHerramientaSerializer,
    APUManoObraSerializer,
    APULogisticaSerializer,
    NotaReporteSerializer,
)


# ============================================================
# 🧾 CLIENTE
# ============================================================


class ClienteListCreateView(generics.ListCreateAPIView):
    queryset = Cliente.objects.all().order_by("nombre")
    serializer_class = ClienteSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["nombre", "encargado", "rif"]


class ClienteDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer


# ============================================================
# 📊 REPORTE
# ============================================================


class ReporteListCreateView(generics.ListCreateAPIView):
    """
    Lista y crea reportes.
    n_presupuesto y fecha_creacion se manejan automáticamente en el modelo.
    """

    queryset = Reporte.objects.select_related("cliente").all()
    serializer_class = ReporteSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = [
        "n_presupuesto",
        "cliente__nombre",
        "cliente__rif",
        "descripcion",
    ]

    # ya no necesitamos calcular_totales aquí
    # def perform_create(self, serializer):
    #     serializer.save()
    # (el modelo se encarga de asignar n_presupuesto)


class ReporteDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Reporte.objects.select_related("cliente").prefetch_related("apus")
    serializer_class = ReporteSerializer


# ============================================================
# ⚙️ CONFIGURACIÓN DE REPORTES
# ============================================================


class ReporteConfigView(APIView):
    """
    GET: obtiene la configuración
    POST: crea/actualiza el primer registro
    """

    def get(self, request, *args, **kwargs):
        config = ReporteConfig.objects.first()
        if not config:
            return Response(
                {"detail": "No existe configuración de reportes."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = ReporteConfigSerializer(config)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, *args, **kwargs):
        config = ReporteConfig.objects.first()
        if config:
            serializer = ReporteConfigSerializer(
                config, data=request.data, partial=True
            )
        else:
            serializer = ReporteConfigSerializer(data=request.data)

        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)


# ============================================================
# 🧮 APU
# ============================================================


class APUListCreateView(generics.ListCreateAPIView):
    """
    Lista y crea APUs asociados a un reporte.
    """

    serializer_class = APUSerializer

    def get_queryset(self):
        reporte_id = self.kwargs.get("reporte_id")
        return APU.objects.filter(reporte_id=reporte_id).prefetch_related(
            "materiales", "herramientas", "manos_obra", "logisticas"
        )

    def perform_create(self, serializer):
        reporte_id = self.kwargs.get("reporte_id")
        reporte = get_object_or_404(Reporte, id=reporte_id)
        apu = serializer.save(reporte=reporte)
        # Si ya quieres dejarlo “limpio”:
        apu.recalcular_totales()


class APUDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = APU.objects.prefetch_related(
        "materiales", "herramientas", "manos_obra", "logisticas"
    )
    serializer_class = APUSerializer

    def perform_update(self, serializer):
        apu = serializer.save()
        apu.recalcular_totales()


# ============================================================
# 🧱 MATERIALES
# ============================================================


class APUMaterialListCreateView(generics.ListCreateAPIView):
    serializer_class = APUMaterialSerializer

    def get_queryset(self):
        apu_id = self.kwargs.get("apu_id")
        return APUMaterial.objects.filter(apu_id=apu_id)

    def perform_create(self, serializer):
        apu_id = self.kwargs.get("apu_id")
        apu = get_object_or_404(APU, id=apu_id)
        material = serializer.save(apu=apu)
        material.apu.recalcular_totales()


class APUMaterialDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = APUMaterial.objects.all()
    serializer_class = APUMaterialSerializer

    def perform_update(self, serializer):
        material = serializer.save()
        material.apu.recalcular_totales()

    def perform_destroy(self, instance):
        apu = instance.apu
        super().perform_destroy(instance)
        apu.recalcular_totales()


# ============================================================
# 🛠️ HERRAMIENTAS
# ============================================================


class APUHerramientaListCreateView(generics.ListCreateAPIView):
    serializer_class = APUHerramientaSerializer

    def get_queryset(self):
        apu_id = self.kwargs.get("apu_id")
        return APUHerramienta.objects.filter(apu_id=apu_id)

    def perform_create(self, serializer):
        apu_id = self.kwargs.get("apu_id")
        apu = get_object_or_404(APU, id=apu_id)
        herramienta = serializer.save(apu=apu)
        herramienta.apu.recalcular_totales()


class APUHerramientaDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = APUHerramienta.objects.all()
    serializer_class = APUHerramientaSerializer

    def perform_update(self, serializer):
        h = serializer.save()
        h.apu.recalcular_totales()

    def perform_destroy(self, instance):
        apu = instance.apu
        super().perform_destroy(instance)
        apu.recalcular_totales()


# ============================================================
# 👷 MANO DE OBRA
# ============================================================


class APUManoObraListCreateView(generics.ListCreateAPIView):
    serializer_class = APUManoObraSerializer

    def get_queryset(self):
        apu_id = self.kwargs.get("apu_id")
        return APUManoObra.objects.filter(apu_id=apu_id)

    def perform_create(self, serializer):
        apu_id = self.kwargs.get("apu_id")
        apu = get_object_or_404(APU, id=apu_id)
        mo = serializer.save(apu=apu)
        mo.apu.recalcular_totales()


class APUManoObraDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = APUManoObra.objects.all()
    serializer_class = APUManoObraSerializer

    def perform_update(self, serializer):
        mo = serializer.save()
        mo.apu.recalcular_totales()

    def perform_destroy(self, instance):
        apu = instance.apu
        super().perform_destroy(instance)
        apu.recalcular_totales()


# ============================================================
# 🚚 LOGÍSTICA
# ============================================================


class APULogisticaListCreateView(generics.ListCreateAPIView):
    serializer_class = APULogisticaSerializer

    def get_queryset(self):
        apu_id = self.kwargs.get("apu_id")
        return APULogistica.objects.filter(apu_id=apu_id)

    def perform_create(self, serializer):
        apu_id = self.kwargs.get("apu_id")
        apu = get_object_or_404(APU, id=apu_id)
        l = serializer.save(apu=apu)
        l.apu.recalcular_totales()


class APULogisticaDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = APULogistica.objects.all()
    serializer_class = APULogisticaSerializer

    def perform_update(self, serializer):
        l = serializer.save()
        l.apu.recalcular_totales()

    def perform_destroy(self, instance):
        apu = instance.apu
        super().perform_destroy(instance)
        apu.recalcular_totales()


class NotaReporteListCreateView(generics.ListCreateAPIView):
    """
    Lista y crea notas para un reporte.
    Si viene reporte_id en la URL, filtra por ese reporte
    y al crear asigna ese reporte automáticamente.
    """
    serializer_class = NotaReporteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        reporte_id = self.kwargs.get("reporte_id")
        qs = NotaReporte.objects.all()
        if reporte_id is not None:
            qs = qs.filter(reporte_id=reporte_id)
        return qs.order_by("-creado_en")

    def perform_create(self, serializer):
        reporte_id = self.kwargs.get("reporte_id")
        if reporte_id is not None:
            serializer.save(reporte_id=reporte_id)
        else:
            serializer.save()


class NotaReporteDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Ver / actualizar / eliminar una nota específica.
    """
    queryset = NotaReporte.objects.all()
    serializer_class = NotaReporteSerializer
    permission_classes = [permissions.IsAuthenticated]
