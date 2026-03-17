from django.contrib import admin
from .models import (
    Departamento,
    Stock,
    Proveedor,
    MovimientoInventario,
    Taza_pesos_dolares,
)


@admin.register(Departamento)
class DepartamentoAdmin(admin.ModelAdmin):
    list_display = ("id", "name")
    search_fields = ("name",)


class StockInline(admin.TabularInline):
    model = Stock
    extra = 0
    fields = (
        "codigo",
        "descripcion",
        "pza",
        "costo",
        "costo_5",
        "costo_15",
        "costo_20",
        "departamento",
        "item_fijo",
    )
    readonly_fields = ("costo", "costo_5", "costo_15", "costo_20")
    show_change_link = True


@admin.register(Proveedor)
class ProveedorAdmin(admin.ModelAdmin):
    list_display = ("name", "direccion", "telefono", "encargado")
    search_fields = ("name", "direccion", "encargado")
    inlines = [StockInline]


@admin.register(Stock)
class StockAdmin(admin.ModelAdmin):
    list_display = (
        "codigo",
        "descripcion",
        "pza",
        "costo",
        "costo_5",
        "costo_15",
        "costo_20",
        "mts_ml_m2",
        "departamento",
        "proveedor",
        "item_fijo",
    )
    list_filter = ("departamento", "proveedor", "item_fijo")
    search_fields = ("codigo", "descripcion", "proveedor__name")
    list_editable = ("item_fijo",)
    readonly_fields = ("costo", "costo_5", "costo_15", "costo_20", "mts_ml_m2")
    ordering = ("-item_fijo", "descripcion")


@admin.register(MovimientoInventario)
class MovimientoInventarioAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "tipo",
        "cantidad",
        "fecha",
        "stock",
        "observacion",
    )
    list_filter = ("tipo", "fecha")
    search_fields = ("stock__codigo", "stock__descripcion", "observacion")
    readonly_fields = ("fecha",)
    ordering = ("-fecha",)


@admin.register(Taza_pesos_dolares)
class TazaAdmin(admin.ModelAdmin):
    list_display = ("id", "valor")
    search_fields = ("valor",)
    list_display_links = ("id", "valor")
    ordering = ("-id",)
