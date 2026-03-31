from django.contrib import admin
from .models import (
    Cliente,
    Reporte,
    ReporteConfig,
    APU,
    APUMaterial,
    APUHerramienta,
    APUManoObra,
    APULogistica,
    NotaReporte,  # 📝 nuevo
)

# ==========================
# 🧍 CLIENTE
# ==========================
@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = ("nombre", "rif", "encargado", "telefono", "correo_electronico")
    search_fields = ("nombre", "rif", "encargado", "correo_electronico")
    ordering = ("nombre",)


# ==========================
# INLINES APU
# ==========================


class APUMaterialInline(admin.TabularInline):
    model = APUMaterial
    extra = 1
    readonly_fields = ("descripcion", "unidad", "precio_unitario", "total_material")
    autocomplete_fields = ("stock", "consumible")


class APUHerramientaInline(admin.TabularInline):
    model = APUHerramienta
    extra = 1
    readonly_fields = ("total_herramienta",)


class APUManoObraInline(admin.TabularInline):
    model = APUManoObra
    extra = 1
    readonly_fields = ("total_mano_obra",)


class APULogisticaInline(admin.TabularInline):
    model = APULogistica
    extra = 1
    readonly_fields = ("total_logistica",)


# ==========================
# 🧮 APU
# ==========================


@admin.register(APU)
class APUAdmin(admin.ModelAdmin):
    list_display = (
        "numero",
        "descripcion",
        "reporte",
        "total_apu",
        "fecha_creacion",
    )
    list_filter = ("reporte", "fecha_creacion")
    search_fields = ("descripcion", "reporte__n_presupuesto")
    readonly_fields = (
        "numero",
        "precio_unitario",
        "total_base",
        "total_materiales",
        "total_herramientas",
        "total_mano_obra",
        "total_logistica",
        "bono_alimenticio",
        "prestaciones_sociales",
        "costo_por_unidad",
        "costo_directo_por_unidad",
        "gastos_administrativos_15",
        "subtotal",
        "utilidad_15",
        "total_apu",
        "fecha_creacion",
    )
    inlines = [
        APUMaterialInline,
        APUHerramientaInline,
        APUManoObraInline,
        APULogisticaInline,
    ]


# ==========================
# 📝 NOTAS DE REPORTE (INLINE)
# ==========================


class NotaReporteInline(admin.TabularInline):
    model = NotaReporte
    extra = 1
    fields = ("titulo", "descripcion", "creado_en", "actualizado_en")
    readonly_fields = ("creado_en", "actualizado_en")


# ==========================
# 📊 REPORTE
# ==========================


class APUInline(admin.TabularInline):
    model = APU
    extra = 1
    readonly_fields = (
        "numero",
        "total_materiales",
        "total_herramientas",
        "total_mano_obra",
        "total_logistica",
        "total_apu",
    )


@admin.register(Reporte)
class ReporteAdmin(admin.ModelAdmin):
    list_display = (
        "n_presupuesto",
        "cliente",
        "descripcion",
        "fecha_creacion",
    )
    list_filter = ("cliente",)
    search_fields = ("n_presupuesto", "cliente__nombre", "cliente__rif")
    readonly_fields = ("n_presupuesto", "fecha_creacion")
    inlines = [NotaReporteInline, APUInline]  # 📝 ahora incluye notas + APUs
    ordering = ("-fecha_creacion",)

    fieldsets = (
        (
            "Información del Reporte",
            {
                "fields": (
                    "n_presupuesto",
                    "cliente",
                    "descripcion",
                    "fecha_creacion",
                    "total_reporte",
                )
            },
        ),
    )


# ==========================
# ⚙️ CONFIGURACIÓN GLOBAL
# ==========================
@admin.register(ReporteConfig)
class ReporteConfigAdmin(admin.ModelAdmin):
    list_display = ("punto_inicio",)
    search_fields = ("punto_inicio",)
