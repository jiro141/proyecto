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
    utilidad_porcentaje_1 = models.DecimalField(
        max_digits=5, decimal_places=2, default=0,
        help_text="Primer porcentaje de utilidad global (0 = sin margen, muestra costo base)"
    )
    utilidad_porcentaje_2 = models.DecimalField(
        max_digits=5, decimal_places=2, default=0,
        help_text="Segundo porcentaje de utilidad global"
    )
    utilidad_porcentaje_3 = models.DecimalField(
        max_digits=5, decimal_places=2, default=0,
        help_text="Tercer porcentaje de utilidad global"
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
    mts_ml_m2_1 = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    mts_ml_m2_2 = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    mts_ml_m2_3 = models.DecimalField(
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
        # Get the latest Taza record (most recent by ID) to ensure we use current tasa and percentages
        taza = Taza_pesos_dolares.objects.order_by("-id").first()
        tasa_valor = taza.valor if taza else Decimal("1.0")
        
        # Obtener porcentajes globales de utilidad
        p1 = taza.utilidad_porcentaje_1 if taza else Decimal("0.00")
        p2 = taza.utilidad_porcentaje_2 if taza else Decimal("0.00")
        p3 = taza.utilidad_porcentaje_3 if taza else Decimal("0.00")
        
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
            # Calcular utilidades para los 3 porcentajes
            utilidad_p1 = (self.costo * (Decimal("1.0") + p1 / Decimal("100"))).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )
            utilidad_p2 = (self.costo * (Decimal("1.0") + p2 / Decimal("100"))).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )
            utilidad_p3 = (self.costo * (Decimal("1.0") + p3 / Decimal("100"))).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )
        else:
            self.utilidad_15 = Decimal("0.00")
            utilidad_p1 = Decimal("0.00")
            utilidad_p2 = Decimal("0.00")
            utilidad_p3 = Decimal("0.00")

        if self.factor_conversion and self.factor_conversion > 0:
            self.mts_ml_m2 = (self.utilidad_15 / self.factor_conversion).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )
            # Calcular mts_ml_m2 para los 3 porcentajes
            self.mts_ml_m2_1 = (utilidad_p1 / self.factor_conversion).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )
            self.mts_ml_m2_2 = (utilidad_p2 / self.factor_conversion).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )
            self.mts_ml_m2_3 = (utilidad_p3 / self.factor_conversion).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )
        else:
            self.mts_ml_m2 = None
            self.mts_ml_m2_1 = None
            self.mts_ml_m2_2 = None
            self.mts_ml_m2_3 = None

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
    """Actualiza automáticamente los costos de todos los Stock al cambiar la tasa o porcentajes."""
    stocks = Stock.objects.all()

    for item in stocks:
        # Update all cost-related fields including the new mts_ml_m2_1/2/3 fields
        # Stock.save() will call calcular_costos() internally
        item.save(update_fields=[
            "costo", "utilidad_15", "mts_ml_m2", 
            "mts_ml_m2_1", "mts_ml_m2_2", "mts_ml_m2_3"
        ])
