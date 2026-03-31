from django.contrib import admin

from cuentas.models import Abono

# Register your models here.
@admin.register(Abono)
class AbonoAdmin(admin.ModelAdmin):
    list_display = ('reporte', 'monto', 'fecha_pago', 'get_descripcion')

    def get_descripcion(self, obj):
        return obj.reporte.descripcion
    get_descripcion.short_description = 'Descripción del Reporte'