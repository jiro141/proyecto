from django.contrib import admin
from .models import (
    LugarConsumo,
    Ubicacion,
    Departamento,
    EPP,
    Stock,
    Consumible,
    Proveedor
)

@admin.register(LugarConsumo)
class LugarConsumoAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')

@admin.register(Ubicacion)
class UbicacionAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')

@admin.register(Departamento)
class DepartamentoAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')

@admin.register(EPP)
class EPPAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'unidades', 'monto')

@admin.register(Stock)
class StockAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'modelo', 'departamento', 'unidades', 'monto')

@admin.register(Consumible)
class ConsumibleAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'modelo', 'departamento', 'unidades', 'monto', 'consumo', 'ubicacion')

@admin.register(Proveedor)
class ProveedorAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'telefono', 'direccion', 'consumible', 'stock', 'epp')
