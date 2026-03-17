from django.contrib import admin
from .models import ReporteInventario


@admin.register(ReporteInventario)
class ReporteInventarioAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "nombre",
        "tipo_reporte",
        "fecha_inicio",
        "fecha_fin",
        "creado_en",
    )
    list_filter = ("tipo_reporte", "fecha_inicio", "fecha_fin")
    search_fields = ("nombre",)
    readonly_fields = ("creado_en",)
    ordering = ("-creado_en",)