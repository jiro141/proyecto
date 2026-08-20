from django.contrib import admin

from .models import Factura, FacturaItem, FacturaConfig


class FacturaItemInline(admin.TabularInline):
    model = FacturaItem
    extra = 0
    readonly_fields = ("total_item",)


@admin.register(Factura)
class FacturaAdmin(admin.ModelAdmin):
    list_display = (
        "n_factura",
        "orden_control",
        "cliente_nombre",
        "fecha",
        "moneda",
        "total",
        "estado",
    )
    list_filter = ("estado", "moneda")
    search_fields = ("n_factura", "orden_control", "cliente_nombre", "cliente_rif")
    readonly_fields = (
        "n_factura",
        "serie",
        "numero",
        "cliente_nombre",
        "cliente_rif",
        "cliente_encargado",
        "cliente_telefono",
        "cliente_direccion",
        "cliente_correo",
        "subtotal",
        "monto_descuento",
        "total",
    )
    inlines = [FacturaItemInline]


@admin.register(FacturaConfig)
class FacturaConfigAdmin(admin.ModelAdmin):
    list_display = ("serie", "punto_inicio")