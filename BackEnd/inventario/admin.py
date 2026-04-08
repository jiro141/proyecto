from django.contrib import admin
from .models import (
    LugarConsumo,
    Ubicacion,
    Departamento,
    EPP,
    Herramienta,
    Empleado,
    Logistica,
    Stock,
    Consumible,
    Proveedor,
    MovimientoInventario,
    Taza_pesos_dolares,
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
    fields = ("codigo", "descripcion", "pza", "costo", "utilidad_15", "departamento")
    readonly_fields = ("costo",)  # 👈 Hacemos el costo de solo lectura
    show_change_link = True


class ConsumibleInline(admin.TabularInline):
    model = Consumible
    extra = 0
    fields = (
        "name",
        "modelo",
        "departamento",
        "unidades",
        "monto",
        "consumo",
        "ubicacion",
    )
    readonly_fields = ()
    show_change_link = True


# ==========================
# PROVEEDOR
# ==========================


@admin.register(Proveedor)
class ProveedorAdmin(admin.ModelAdmin):
    list_display = ("name", "direccion", "telefono", "encargado")
    search_fields = ("name", "direccion", "encargado")
    inlines = [EPPInline, StockInline, ConsumibleInline]


# ==========================
# PRODUCTOS INDIVIDUALES
# ==========================


@admin.register(Stock)
class StockAdmin(admin.ModelAdmin):
    list_display = (
        "codigo",
        "descripcion",
        "pza",
        "costo",
        "utilidad_15",
        "mts_ml_m2",
        "item_fijo",
    )
    list_filter = ("departamento", "item_fijo")
    search_fields = ("codigo", "descripcion")
    list_editable = ("item_fijo",)  # ✅ Permite editar directamente desde la lista
    ordering = ("-item_fijo", "descripcion")


@admin.register(EPP)
class EPPAdmin(admin.ModelAdmin):
    list_display = ("name", "unidades", "monto", "proveedor", "item_fijo")
    list_filter = ("proveedor", "item_fijo")
    search_fields = ("name",)
    list_editable = ("item_fijo",)
    ordering = ("-item_fijo", "name")


@admin.register(Herramienta)
class HerramientaAdmin(admin.ModelAdmin):
    list_display = ("descripcion", "unidad", "cantidad", "depreciacion_bs_hora", "item_fijo")
    list_filter = ("item_fijo",)
    search_fields = ("descripcion",)
    list_editable = ("item_fijo",)
    ordering = ("-item_fijo", "descripcion")


@admin.register(Empleado)
class EmpleadoAdmin(admin.ModelAdmin):
    list_display = ("descripcion", "unidad", "cantidad", "precio_unitario", "item_fijo")
    list_filter = ("item_fijo",)
    search_fields = ("descripcion",)
    list_editable = ("item_fijo",)
    ordering = ("-item_fijo", "descripcion")


@admin.register(Logistica)
class LogisticaAdmin(admin.ModelAdmin):
    list_display = ("descripcion", "unidad", "cantidad", "precio_unitario", "item_fijo")
    list_filter = ("item_fijo",)
    search_fields = ("descripcion",)
    list_editable = ("item_fijo",)
    ordering = ("-item_fijo", "descripcion")


@admin.register(Consumible)
class ConsumibleAdmin(admin.ModelAdmin):
    list_display = ("codigo", "descripcion", "costo", "departamento", "item_fijo")
    list_filter = ("departamento", "item_fijo")
    search_fields = ("descripcion", "codigo")
    list_editable = ("item_fijo",)
    ordering = ("-item_fijo", "descripcion")


# ==========================
# MOVIMIENTOS DE INVENTARIO
# ==========================


@admin.register(MovimientoInventario)
class MovimientoInventarioAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "tipo",
        "cantidad",
        "fecha",
        "stock",
        "epp",
        "consumible",
        "observacion",
    )
    list_filter = ("tipo", "fecha")
    search_fields = ("stock__descripcion", "epp__name", "consumible__name")
    readonly_fields = ("fecha",)


# ==========================
# TASA PESOS/DÓLARES
# ==========================


@admin.register(Taza_pesos_dolares)
class TazaAdmin(admin.ModelAdmin):
    list_display = ("id", "valor")
    search_fields = ("valor",)
    list_display_links = ("id", "valor")
    ordering = ("-id",)
