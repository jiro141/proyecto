# reportes/urls.py
from django.urls import path
from .views import (
    ClienteListCreateView, ClienteDetailView,
    ReporteListCreateView, ReporteDetailView,
    ReporteConfigView
)

urlpatterns = [
    path("clientes/", ClienteListCreateView.as_view(), name="cliente-list"),
    path("clientes/<int:pk>/", ClienteDetailView.as_view(), name="cliente-detail"),
    path("reporte/", ReporteListCreateView.as_view(), name="reporte-list"),
    path("reporte/<int:pk>/", ReporteDetailView.as_view(), name="reporte-detail"),
    path("reporte/config/", ReporteConfigView.as_view(), name="reporte-config"),
]
