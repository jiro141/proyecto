from django.db import models
from django.utils import timezone
from inventario.models import Stock, Consumible, EPP


# ==========================
# CLIENTE
# ==========================


class Cliente(models.Model):
    nombre = models.CharField(max_length=150)
    rif = models.CharField(max_length=20, unique=True, default="PENDIENTE")
    encargado = models.CharField(max_length=150)
    telefono = models.CharField(max_length=20)
    direccion = models.CharField(max_length=255)
    correo_electronico = models.EmailField(unique=True)

    def __str__(self):
        return f"{self.nombre} ({self.rif})"


# ==========================
# CONFIGURACIÓN DE REPORTES
# ==========================


class ReporteConfig(models.Model):
    """Configuración global para definir el punto de inicio de los n_control."""

    punto_inicio = models.PositiveIntegerField(null=True, blank=True)  # ✅ sin default

    def __str__(self):
        return f"Punto de inicio: {self.punto_inicio or 'Sin definir'}"

    class Meta:
        verbose_name = "Configuración de Reportes"
        verbose_name_plural = "Configuración de Reportes"

# ==========================
# REPORTE (UNO A MUCHOS CON CLIENTE)
# ==========================


class Reporte(models.Model):
    n_control = models.CharField(
        max_length=50,
        unique=True,
        editable=False,
        help_text="Número de control autogenerado secuencial.",
    )

    # 🔗 Relación uno a muchos: un cliente puede tener varios reportes
    cliente = models.ForeignKey(
        Cliente,
        on_delete=models.CASCADE,  # si se borra el cliente → se borran sus reportes
        related_name="reportes",  # permite acceder con cliente.reportes.all()
    )

    fecha = models.DateField(default=timezone.now)

    # Relaciones con inventario
    stock_almacen = models.ManyToManyField(
        Stock, blank=True, related_name="reportes_almacen"
    )
    stock_comprar = models.ManyToManyField(
        Stock, blank=True, related_name="reportes_comprar"
    )
    consumibles = models.ManyToManyField(
        Consumible, blank=True, related_name="reportes_consumibles"
    )
    epps = models.ManyToManyField(EPP, blank=True, related_name="reportes_epps")

    presupuesto_estimado = models.DecimalField(max_digits=12, decimal_places=2)
    porcentaje_productividad = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        help_text="Valor entre 0 y 1 (ejemplo: 0.75 = 75%)",
    )

    lugar = models.CharField(max_length=200)
    fecha_estimacion_culminacion = models.DateField(blank=True, null=True)

    observaciones = models.TextField(blank=True, null=True)
    aprobado = models.BooleanField(default=False)

    class Meta:
        ordering = ["-fecha", "-id"]
        verbose_name = "Reporte"
        verbose_name_plural = "Reportes"

    def save(self, *args, **kwargs):
        """Autogenera el número de control (n_control) incremental."""
        if not self.n_control:
            config = ReporteConfig.objects.first()
            punto_inicio = config.punto_inicio if config else 1

            ultimo = Reporte.objects.order_by("-id").first()
            if ultimo:
                try:
                    self.n_control = str(int(ultimo.n_control) + 1)
                except ValueError:
                    # Si el n_control no es numérico, reinicia desde el punto de inicio
                    self.n_control = str(punto_inicio)
            else:
                self.n_control = str(punto_inicio)

        super().save(*args, **kwargs)

    def __str__(self):
        return f"Reporte {self.n_control} - {self.cliente.nombre}"
