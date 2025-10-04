from django.urls import path
from . import views

urlpatterns = [
    # Clientes
    path("clientes/", views.ClienteListCreateView.as_view(), name="cliente-list-create"),
    path("clientes/<int:pk>/", views.ClienteDetailView.as_view(), name="cliente-detail"),

    # Reportes
    path("reportes/", views.ReporteListCreateView.as_view(), name="reporte-list-create"),
    path("reportes/<int:pk>/", views.ReporteDetailView.as_view(), name="reporte-detail"),

    # Configuración de reportes
    path("config/", views.ReporteConfigView.as_view(), name="reporte-config"),
]
