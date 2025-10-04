from django.contrib import admin
from .models import Cliente, Reporte, ReporteConfig


@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = ("nombre", "rif", "encargado", "telefono", "correo_electronico")
    search_fields = ("nombre", "rif", "encargado", "correo_electronico")


@admin.register(Reporte)
class ReporteAdmin(admin.ModelAdmin):
    list_display = ("n_control", "cliente", "fecha", "presupuesto_estimado", "aprobado")
    list_filter = ("aprobado", "fecha", "cliente")
    search_fields = ("n_control", "cliente__nombre", "lugar")
    filter_horizontal = ("stock_almacen", "stock_comprar", "consumibles")


@admin.register(ReporteConfig)
class ReporteConfigAdmin(admin.ModelAdmin):
    list_display = ("punto_inicio",)
