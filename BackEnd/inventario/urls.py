from rest_framework.routers import DefaultRouter
from django.urls import path, include

from .views import (
    DepartamentoViewSet,
    StockViewSet,
    ProveedorViewSet,
    MovimientoInventarioViewSet,
    TazaViewSet,
)

router = DefaultRouter()
router.register(r"departamentos", DepartamentoViewSet, basename="departamento")
router.register(r"stock", StockViewSet, basename="stock")
router.register(r"proveedores", ProveedorViewSet, basename="proveedor")
router.register(r"movimientos", MovimientoInventarioViewSet, basename="movimiento")
router.register(r"taza", TazaViewSet, basename="taza")

urlpatterns = [
    path("", include(router.urls)),
]