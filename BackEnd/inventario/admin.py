from django.contrib import admin
from .models import (
    LugarConsumo,
    Ubicacion,
    Departamento,
    EPP,
    Stock,
    Consumible,
    Proveedor,
)


# ==========================
# CLASES BÁSICAS
# ==========================

@admin.register(LugarConsumo)
class LugarConsumoAdmin(admin.ModelAdmin):
    list_display = ("id", "name")
    search_fields = ("name",)


@admin.register(Ubicacion)
class UbicacionAdmin(admin.ModelAdmin):
    list_display = ("id", "name")
    search_fields = ("name",)


@admin.register(Departamento)
class DepartamentoAdmin(admin.ModelAdmin):
    list_display = ("id", "name")
    search_fields = ("name",)


# ==========================
# INLINES (para mostrar productos en proveedor)
# ==========================

class EPPInline(admin.TabularInline):
    model = EPP
    extra = 0
    fields = ("name", "unidades", "monto")
    readonly_fields = ()
    show_change_link = True


class StockInline(admin.TabularInline):
    model = Stock
    extra = 0
    fields = ("name", "modelo", "departamento", "unidades", "monto")
    readonly_fields = ()
    show_change_link = True


class ConsumibleInline(admin.TabularInline):
    model = Consumible
    extra = 0
    fields = ("name", "modelo", "departamento", "unidades", "monto", "consumo", "ubicacion")
    readonly_fields = ()
    show_change_link = True


# ==========================
# PROVEEDOR
# ==========================

@admin.register(Proveedor)
class ProveedorAdmin(admin.ModelAdmin):
    list_display = ("name", "direccion", "telefono", "encargado")
    search_fields = ("name", "direccion", "encargado")

    # Mostrar productos relacionados directamente en la vista del proveedor
    inlines = [EPPInline, StockInline, ConsumibleInline]


# ==========================
# PRODUCTOS (individuales)
# ==========================

@admin.register(EPP)
class EPPAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "unidades", "monto", "proveedor")
    search_fields = ("name", "proveedor__name")
    list_filter = ("proveedor",)


@admin.register(Stock)
class StockAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "modelo", "departamento", "unidades", "monto", "proveedor")
    search_fields = ("name", "modelo", "proveedor__name")
    list_filter = ("departamento", "proveedor")


@admin.register(Consumible)
class ConsumibleAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "modelo",
        "departamento",
        "unidades",
        "monto",
        "consumo",
        "ubicacion",
        "proveedor",
    )
    search_fields = ("name", "modelo", "proveedor__name")
    list_filter = ("departamento", "proveedor")
