from django.contrib import admin

from .models import (
    Factura, FacturaItem, FacturaConfig,
    NotaCredito, NotaCreditoItem, NotaCreditoConfig,
    NotaDebito, NotaDebitoItem, NotaDebitoConfig,
)


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


# ============================================================
# 📄 NOTAS DE CRÉDITO
# ============================================================


class NotaCreditoItemInline(admin.TabularInline):
    model = NotaCreditoItem
    extra = 0
    readonly_fields = ("total_item",)


@admin.register(NotaCredito)
class NotaCreditoAdmin(admin.ModelAdmin):
    list_display = (
        "n_nota",
        "factura",
        "cliente_nombre",
        "fecha",
        "moneda",
        "total",
        "estado",
    )
    list_filter = ("estado", "moneda")
    search_fields = ("n_nota", "cliente_nombre", "cliente_rif")
    readonly_fields = (
        "n_nota",
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
    inlines = [NotaCreditoItemInline]


@admin.register(NotaCreditoConfig)
class NotaCreditoConfigAdmin(admin.ModelAdmin):
    list_display = ("serie", "punto_inicio")


# ============================================================
# 📄 NOTAS DE DÉBITO
# ============================================================


class NotaDebitoItemInline(admin.TabularInline):
    model = NotaDebitoItem
    extra = 0
    readonly_fields = ("total_item",)


@admin.register(NotaDebito)
class NotaDebitoAdmin(admin.ModelAdmin):
    list_display = (
        "n_nota",
        "factura",
        "cliente_nombre",
        "fecha",
        "moneda",
        "total",
        "estado",
    )
    list_filter = ("estado", "moneda")
    search_fields = ("n_nota", "cliente_nombre", "cliente_rif")
    readonly_fields = (
        "n_nota",
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
    inlines = [NotaDebitoItemInline]


@admin.register(NotaDebitoConfig)
class NotaDebitoConfigAdmin(admin.ModelAdmin):
    list_display = ("serie", "punto_inicio")
