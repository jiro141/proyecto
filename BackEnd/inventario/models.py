from decimal import Decimal, ROUND_HALF_UP

from django.core.exceptions import ValidationError
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver


# ==========================
# MODELOS BASE
# ==========================


class Departamento(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name


# ==========================
# PROVEEDOR
# ==========================


class Proveedor(models.Model):
    name = models.CharField(max_length=100)
    direccion = models.CharField(max_length=255)
    telefono = models.CharField(max_length=20)
    encargado = models.CharField(max_length=100, null=True, blank=True)

    def __str__(self):
        return self.name


# ==========================
# CONFIGURACIÓN GLOBAL
# ==========================


class Taza_pesos_dolares(models.Model):
    """Configuración global de la tasa de conversión."""

    valor = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Tasa pesos/dólar actual",
    )

    def __str__(self):
        return f"Tasa: {self.valor}"

    class Meta:
        verbose_name = "Tasa Pesos/Dólares"
        verbose_name_plural = "Tasas Pesos/Dólares"


# ==========================
# STOCK
# ==========================


class Stock(models.Model):
    codigo = models.CharField(max_length=50)
    descripcion = models.CharField(max_length=255)
    pza = models.CharField(max_length=50)

    cantidad_disponible = models.IntegerField(
        default=0,
        help_text="Cantidad disponible actualmente en inventario",
    )

    # Costos base
    costo_pesos = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    costo_dolares = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    envio = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True, default=0
    )

    # Costo final base en dólares
    costo = models.DecimalField(
        max_digits=10, decimal_places=2, default=0, null=True, blank=True
    )

    # Costos con utilidad
    costo_5 = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    costo_15 = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    costo_20 = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    factor_conversion = models.DecimalField(
        max_digits=10,
        decimal_places=4,
        null=True,
        blank=True,
        help_text="Factor usado para calcular mts_ml_m2",
    )

    mts_ml_m2 = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )

    item_fijo = models.BooleanField(
        default=False,
        help_text="Indica si es un ítem fijo del sistema.",
    )

    proveedor = models.ForeignKey(
        Proveedor,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="stocks",
    )

    departamento = models.ForeignKey(
        Departamento,
        on_delete=models.CASCADE,
        related_name="stocks",
    )

    def __str__(self):
        return f"{self.codigo} - {self.descripcion}"

    def calcular_costos(self):
        """
        Reglas:
        - Si hay costo_dolares: costo = costo_dolares + envio
        - Si no hay costo_dolares: costo = (costo_pesos + envio) / tasa
        - Luego:
            costo_5  = costo + 5%
            costo_15 = costo + 15%
            costo_20 = costo + 20%
        """
        tasa = Taza_pesos_dolares.objects.first()
        tasa_valor = tasa.valor if tasa and tasa.valor else Decimal("1.00")

        costo_pesos = self.costo_pesos or Decimal("0.00")
        costo_dolares = self.costo_dolares or Decimal("0.00")
        envio = self.envio or Decimal("0.00")

        if self.costo_dolares:
            self.costo = costo_dolares + envio
        else:
            self.costo = (costo_pesos + envio) / tasa_valor

        self.costo = self.costo.quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP)

        self.costo_5 = (self.costo * Decimal("1.05")).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        self.costo_15 = (self.costo * Decimal("1.15")).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        self.costo_20 = (self.costo * Decimal("1.20")).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )

        if self.factor_conversion and self.factor_conversion > 0:
            self.mts_ml_m2 = (self.costo_20 / self.factor_conversion).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )
        else:
            self.mts_ml_m2 = None

    def save(self, *args, **kwargs):
        self.calcular_costos()
        super().save(*args, **kwargs)


# ==========================
# MOVIMIENTOS DE INVENTARIO
# ==========================


class MovimientoInventario(models.Model):
    TIPO_CHOICES = (
        ("entrada", "Entrada"),
        ("salida", "Salida"),
        ("ajuste", "Ajuste"),
    )

    fecha = models.DateTimeField(auto_now_add=True)
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES)
    cantidad = models.IntegerField()
    observacion = models.TextField(blank=True)

    stock = models.ForeignKey(
        Stock,
        on_delete=models.CASCADE,
        related_name="movimientos",
    )

    def save(self, *args, **kwargs):
        es_nuevo = self.pk is None

        if es_nuevo:
            if self.tipo == "salida" and self.stock.cantidad_disponible < self.cantidad:
                raise ValidationError(
                    "No hay suficiente cantidad disponible para registrar la salida."
                )

        super().save(*args, **kwargs)

        if es_nuevo:
            if self.tipo == "entrada":
                self.stock.cantidad_disponible += self.cantidad
            elif self.tipo == "salida":
                self.stock.cantidad_disponible -= self.cantidad
            elif self.tipo == "ajuste":
                self.stock.cantidad_disponible = self.cantidad

            self.stock.save(update_fields=["cantidad_disponible"])

    def __str__(self):
        return (
            f"{self.tipo.upper()} - {self.stock} - "
            f"{self.cantidad}u - {self.fecha.strftime('%d/%m/%Y')}"
        )


# ==========================
# SEÑAL: actualizar Stock al cambiar la tasa
# ==========================


@receiver(post_save, sender=Taza_pesos_dolares)
def actualizar_costos_stock(sender, instance, **kwargs):
    """Actualiza automáticamente los costos de todos los Stock al cambiar la tasa."""
    stocks = Stock.objects.all()

    for item in stocks:
        if not item.costo_dolares:
            item.calcular_costos()
            item.save(
                update_fields=["costo", "costo_5",
                               "costo_15", "costo_20", "mts_ml_m2"]
            )
