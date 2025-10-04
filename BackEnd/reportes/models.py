from django.db import models
from django.utils import timezone
from inventario.models import Stock, Consumible


class Cliente(models.Model):
    nombre = models.CharField(max_length=150)
    rif = models.CharField(max_length=20, unique=True, default="PENDIENTE")
    encargado = models.CharField(max_length=150)
    telefono = models.CharField(max_length=20)
    direccion = models.CharField(max_length=255)
    correo_electronico = models.EmailField(unique=True)

    def __str__(self):
        return f"{self.nombre} ({self.rif})"


class ReporteConfig(models.Model):
    """Configuración global para definir el punto de inicio de los n_control"""
    punto_inicio = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"Punto de inicio: {self.punto_inicio}"

    class Meta:
        verbose_name = "Configuración de Reportes"
        verbose_name_plural = "Configuración de Reportes"


class Reporte(models.Model):
    n_control = models.CharField(max_length=50, unique=True, editable=False)  # se autogenera
    cliente = models.ForeignKey(
        Cliente, on_delete=models.CASCADE, related_name="reportes"
    )
    fecha = models.DateField(default=timezone.now)

    stock_almacen = models.ManyToManyField(
        Stock,
        blank=True,
        related_name="reportes_almacen",
    )
    stock_comprar = models.ManyToManyField(
        Stock,
        blank=True,
        related_name="reportes_comprar",
    )
    consumibles = models.ManyToManyField(Consumible, blank=True)

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

    def save(self, *args, **kwargs):
        if not self.n_control:  # solo al crear
            # obtenemos el punto de inicio
            config = ReporteConfig.objects.first()
            punto_inicio = config.punto_inicio if config else 1

            # buscamos el último reporte creado
            ultimo = Reporte.objects.order_by("-n_control").first()
            if ultimo:
                self.n_control = str(int(ultimo.n_control) + 1)
            else:
                self.n_control = str(punto_inicio)

        super().save(*args, **kwargs)

    def __str__(self):
        return f"Reporte {self.n_control} - {self.cliente.nombre}"
