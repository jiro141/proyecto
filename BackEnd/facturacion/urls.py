from django.urls import path
from .views import (
    FacturaListCreateView,
    FacturaDetailView,
    AnularFacturaView,
    PresupuestosDisponiblesView,
    PendienteFacturaView,
    FacturaConfigView,
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
]