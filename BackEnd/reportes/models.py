from django.db import models
from django.utils import timezone


class ReporteInventario(models.Model):
    TIPO_REPORTE_CHOICES = (
        ("mensual", "Mensual"),
        ("semanal", "Semanal"),
        ("diario", "Diario"),
        ("personalizado", "Personalizado"),
    )

    nombre = models.CharField(max_length=150)
    tipo_reporte = models.CharField(max_length=20, choices=TIPO_REPORTE_CHOICES)
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    creado_en = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.nombre} ({self.fecha_inicio} - {self.fecha_fin})"