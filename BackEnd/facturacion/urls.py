from django.urls import path
from .views import (
    FacturaListCreateView,
    FacturaDetailView,
    AnularFacturaView,
    PresupuestosDisponiblesView,
    PendienteFacturaView,
    FacturaConfigView,
    NotaCreditoListCreateView,
    NotaCreditoDetailView,
    NotaCreditoConfigView,
    NotaDebitoListCreateView,
    NotaDebitoDetailView,
    NotaDebitoConfigView,
)

urlpatterns = [
    # ===============================
    # 🧾 FACTURAS
    # ===============================
    path("", FacturaListCreateView.as_view(), name="factura-list"),
    path("<int:pk>/", FacturaDetailView.as_view(), name="factura-detail"),
    path(
        "<int:pk>/anular/",
        AnularFacturaView.as_view(),
        name="factura-anular",
    ),
    # ===============================
    # 📋 PRESUPUESTOS DISPONIBLES
    # ===============================
    path(
        "presupuestos-disponibles/",
        PresupuestosDisponiblesView.as_view(),
        name="presupuestos-disponibles",
    ),
    path(
        "presupuestos/<int:reporte_id>/pendiente/",
        PendienteFacturaView.as_view(),
        name="presupuesto-pendiente",
    ),
    # ===============================
    # ⚙️ CONFIGURACIÓN
    # ===============================
    path("config/", FacturaConfigView.as_view(), name="factura-config"),
    # ===============================
    # 📄 NOTAS DE CRÉDITO
    # ===============================
    path(
        "notas-credito/",
        NotaCreditoListCreateView.as_view(),
        name="nota-credito-list",
    ),
    path(
        "notas-credito/<int:pk>/",
        NotaCreditoDetailView.as_view(),
        name="nota-credito-detail",
    ),
    path(
        "notas-credito/config/",
        NotaCreditoConfigView.as_view(),
        name="nota-credito-config",
    ),
    # ===============================
    # 📄 NOTAS DE DÉBITO
    # ===============================
    path(
        "notas-debito/",
        NotaDebitoListCreateView.as_view(),
        name="nota-debito-list",
    ),
    path(
        "notas-debito/<int:pk>/",
        NotaDebitoDetailView.as_view(),
        name="nota-debito-detail",
    ),
    path(
        "notas-debito/config/",
        NotaDebitoConfigView.as_view(),
        name="nota-debito-config",
    ),
]
