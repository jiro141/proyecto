from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from decimal import Decimal, ROUND_HALF_UP


# ==========================
# MODELOS BASE
# ==========================


class LugarConsumo(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name


class Ubicacion(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name


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
# PRODUCTOS Y CONFIGURACIONES
# ==========================


class Taza_pesos_dolares(models.Model):
    """Configuración global de la tasa de conversión."""

    valor = models.DecimalField(
        max_digits=10, decimal_places=2, help_text="Tasa pesos/dólar actual"
    )

    def __str__(self):
        return f"Tasa: {self.valor}"

    class Meta:
        verbose_name = "Tasa Pesos/Dólares"
        verbose_name_plural = "Tasas Pesos/Dólares"


class Stock(models.Model):
    codigo = models.CharField(max_length=50)
    descripcion = models.CharField(max_length=255)
    pza = models.CharField(max_length=50)

    # Campos de costo
    costo_pesos = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    costo_dolares = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    envio = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    costo = models.DecimalField(
        max_digits=10, decimal_places=2, default=0, null=True, blank=True
    )

    factor_conversion = models.DecimalField(
        max_digits=10,
        decimal_places=4,
        null=True,
        blank=True,
        help_text="Factor usado para calcular mts_ml_m2 (costo / factor_conversion)",
    )

    utilidad_15 = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    mts_ml_m2 = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    item_fijo = models.BooleanField(
        default=False, help_text="Indica si es un ítem fijo del sistema."
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
        """Cálculo automático de costo, utilidad y mts_ml_m2."""
        taza = Taza_pesos_dolares.objects.first()
        tasa_valor = taza.valor if taza else Decimal("1.0")
        costo_pesos = self.costo_pesos or Decimal("0.00")
        envio = self.envio or Decimal("0.00")

        if self.costo_dolares:
            self.costo = self.costo_dolares + envio
        else:
            self.costo = (costo_pesos + envio) / tasa_valor

        self.costo = self.costo.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        if self.costo > 0:
            self.utilidad_15 = (self.costo * Decimal("1.15")).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )
        else:
            self.utilidad_15 = Decimal("0.00")

        if self.factor_conversion and self.factor_conversion > 0:
            self.mts_ml_m2 = (self.utilidad_15 / self.factor_conversion).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )
        else:
            self.mts_ml_m2 = None

    def save(self, *args, **kwargs):
        self.calcular_costos()
        super().save(*args, **kwargs)


class EPP(models.Model):
    name = models.CharField(max_length=100)
    unidades = models.IntegerField()
    monto = models.FloatField()
    item_fijo = models.BooleanField(
        default=False, help_text="Indica si es un ítem fijo del sistema."
    )
    proveedor = models.ForeignKey(
        Proveedor, on_delete=models.SET_NULL, null=True, blank=True, related_name="epps"
    )

    def __str__(self):
        return self.name


class Consumible(models.Model):
    codigo = models.CharField(max_length=100)
    descripcion = models.CharField(max_length=100, db_column="descipcion")
    departamento = models.ForeignKey(Departamento, on_delete=models.CASCADE)
    unidad = models.CharField(max_length=20, default="UND")
    costo = models.FloatField()
    item_fijo = models.BooleanField(
        default=False, help_text="Indica si es un ítem fijo del sistema."
    )
    consumo = models.ForeignKey(LugarConsumo, on_delete=models.CASCADE)
    ubicacion = models.ForeignKey(Ubicacion, on_delete=models.CASCADE)
    proveedor = models.ForeignKey(
        Proveedor,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="consumibles",
    )

    def __str__(self):
        return f"{self.codigo} - {self.descripcion}"

    class Meta:
        ordering = ("codigo",)
        verbose_name = "Consumible"
        verbose_name_plural = "Consumibles"


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

    stock = models.ForeignKey(Stock, on_delete=models.CASCADE, null=True, blank=True)
    epp = models.ForeignKey(EPP, on_delete=models.CASCADE, null=True, blank=True)
    consumible = models.ForeignKey(
        Consumible, on_delete=models.CASCADE, null=True, blank=True
    )

    def __str__(self):
        producto = self.stock or self.epp or self.consumible
        return f"{self.tipo.upper()} - {producto} - {self.cantidad}u - {self.fecha.strftime('%d/%m/%Y')}"


# ==========================
# SEÑAL: actualizar Stock al cambiar la tasa
# ==========================


@receiver(post_save, sender=Taza_pesos_dolares)
def actualizar_costos_stock(sender, instance, **kwargs):
    """Actualiza automáticamente los costos de todos los Stock al cambiar la tasa."""
    tasa_valor = instance.valor or Decimal("1.0")
    stocks = Stock.objects.all()

    for item in stocks:
        if not item.costo_dolares:
            item.calcular_costos()
            item.save(update_fields=["costo", "utilidad_15", "mts_ml_m2"])
