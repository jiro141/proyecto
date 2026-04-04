from django.urls import path
from .views import (
    # Clientes
    ClienteListCreateView,
    ClienteDetailView,
    # Reportes
    ReporteListCreateView,
    ReporteDetailView,
    ReporteConfigView,
    CuentasPorCobrarView,
    ReporteAbonosView,
    # APUs
    APUListCreateView,
    APUDetailView,
    # Materiales
    APUMaterialListCreateView,
    APUMaterialDetailView,
    # Herramientas
    APUHerramientaListCreateView,
    APUHerramientaDetailView,
    # Mano de obra
    APUManoObraListCreateView,
    APUManoObraDetailView,
    # Logística
    APULogisticaListCreateView,
    APULogisticaDetailView,
    # Notas de reporte 
    NotaReporteListCreateView,
    NotaReporteDetailView,
)

urlpatterns = [
    # ===============================
    # 🧍 CLIENTES
    # ===============================
    path("clientes/", ClienteListCreateView.as_view(), name="cliente-list"),
    path("clientes/<int:pk>/", ClienteDetailView.as_view(), name="cliente-detail"),
    # ===============================
    # 📊 REPORTES (Presupuestos Globales)
    # ===============================
    path("", ReporteListCreateView.as_view(), name="reporte-list"),
    path("<int:pk>/", ReporteDetailView.as_view(), name="reporte-detail"),
    # ===============================
    # 💰 CUENTAS POR COBRAR
    # ===============================
    path("cuentas-cobrar/", CuentasPorCobrarView.as_view(), name="cuentas-cobrar"),
    path("<int:reporte_id>/abonos/", ReporteAbonosView.as_view(), name="reporte-abonos"),
    # ===============================
    # ⚙️ CONFIGURACIÓN GLOBAL
    # ===============================
    path("config/", ReporteConfigView.as_view(), name="reporte-config"),
    # ===============================
    # 🧮 APUs (Análisis de Precios Unitarios)
    # ===============================
    path(
        "<int:reporte_id>/apus/",
        APUListCreateView.as_view(),
        name="apu-list",
    ),
    path("apus/<int:pk>/", APUDetailView.as_view(), name="apu-detail"),
    # ===============================
    # 🧱 MATERIALES
    # ===============================
    path(
        "apus/<int:apu_id>/materiales/",
        APUMaterialListCreateView.as_view(),
        name="apu-material-list",
    ),
    path(
        "materiales/<int:pk>/",
        APUMaterialDetailView.as_view(),
        name="apu-material-detail",
    ),
    # ===============================
    # 🛠️ HERRAMIENTAS
    # ===============================
    path(
        "apus/<int:apu_id>/herramientas/",
        APUHerramientaListCreateView.as_view(),
        name="apu-herramienta-list",
    ),
    path(
        "herramientas/<int:pk>/",
        APUHerramientaDetailView.as_view(),
        name="apu-herramienta-detail",
    ),
    # ===============================
    # 👷 MANO DE OBRA
    # ===============================
    path(
        "apus/<int:apu_id>/mano-obra/",
        APUManoObraListCreateView.as_view(),
        name="apu-mano-obra-list",
    ),
    path(
        "mano-obra/<int:pk>/",
        APUManoObraDetailView.as_view(),
        name="apu-mano-obra-detail",
    ),
    # ===============================
    # 🚚 LOGÍSTICA
    # ===============================
    path(
        "apus/<int:apu_id>/logistica/",
        APULogisticaListCreateView.as_view(),
        name="apu-logistica-list",
    ),
    path(
        "logistica/<int:pk>/",
        APULogisticaDetailView.as_view(),
        name="apu-logistica-detail",
    ),
    # ===============================
    # 📝 NOTAS DE REPORTE
    # ===============================
    path(
        "<int:reporte_id>/notas/",
        NotaReporteListCreateView.as_view(),
        name="nota-reporte-list",
    ),
    path(
        "notas/<int:pk>/",
        NotaReporteDetailView.as_view(),
        name="nota-reporte-detail",
    ),
]
