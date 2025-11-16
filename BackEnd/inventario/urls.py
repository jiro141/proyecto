from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import *

router = DefaultRouter()
router.register(r'lugares', LugarConsumoViewSet)
router.register(r'ubicaciones', UbicacionViewSet)
router.register(r'departamentos', DepartamentoViewSet)
router.register(r'epp', EPPViewSet)
router.register(r'stock', StockViewSet)
router.register(r'consumibles', ConsumibleViewSet)
router.register(r'proveedores', ProveedorViewSet)
router.register(r'movimientos', MovimientoInventarioViewSet)
router.register(r"taza", TazaViewSet, basename="taza")

urlpatterns = [
    path('', include(router.urls)),
]
