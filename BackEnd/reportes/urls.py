from django.urls import path
from .views import ReportePorProductoView, ReporteMensualView

urlpatterns = [
    path("por-producto/", ReportePorProductoView.as_view(), name="reporte-por-producto"),
    path("mensual/", ReporteMensualView.as_view(), name="reporte-mensual"),
]