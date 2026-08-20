from decimal import Decimal

from django.db import models
from django.utils import timezone

from reportes.models import Reporte, APU, Cliente


# ==========================
# ESTADOS DE FACTURA
# ==========================


class EstadoFactura(models.TextChoices):
    EMITIDA = "EMITIDA", "Emitida"
    ANULADA = "ANULADA", "Anulada"


# ==========================
# CONFIGURACIÓN DE FACTURAS
# ==========================


class FacturaConfig(models.Model):
    """
    Configuración de la numeración de facturas.
    serie: prefijo del número de control (ej: "A" → A-0001)
    punto_inicio: número desde el que empieza la secuencia
    """

    serie = models.CharField(
        max_length=10,
        default="A",
        verbose_name="Serie",
        help_text="Prefijo del número de control (ej: A → A-0001)",
    )
    punto_inicio = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name="Punto de inicio",
        help_text="Número desde el que empieza la secuencia",
    )

    class Meta:
        verbose_name = "Configuración de Facturas"
        verbose_name_plural = "Configuración de Facturas"

    def __str__(self):
        return f"Serie {self.serie} - Inicio: {self.punto_inicio or 1}"


# ==========================
# FACTURA
# ==========================


class Factura(models.Model):
    """
    Factura asociada a un Reporte (presupuesto) en estado EJECUTADO.
    Un presupuesto puede tener múltiples facturas (facturación parcial).
    """

    MONEDA_CHOICES = (
        ("USD", "Dólares (USD)"),
        ("BS", "Bolívares (Bs)"),
    )

    reporte = models.ForeignKey(
        Reporte,
        on_delete=models.CASCADE,
        related_name="facturas",
        verbose_name="Presupuesto",
    )

    # --- Control de numeración ---
    serie = models.CharField(max_length=10, editable=False)
    numero = models.PositiveIntegerField(editable=False)
    n_factura = models.CharField(
        max_length=30,
        unique=True,
        editable=False,
        verbose_name="Número de factura",
        help_text="Formato Serie-NNNN (ej: A-0001)",
    )

    orden_servicio = models.CharField(
        max_length=50,
        default="",
        blank=True,
        verbose_name="Orden de servicio",
        help_text="Número de orden de servicio asociado a la factura",
    )

    orden_control = models.CharField(
        max_length=50,
        default="",
        blank=True,
        verbose_name="Orden de control",
        help_text="Número de orden de control asociado a la factura",
    )

    factura_completa = models.BooleanField(
        default=False,
        editable=False,
        verbose_name="Factura completa",
        help_text="True si la factura se emitió por el monto total del presupuesto (modo descripción completa).",
    )

    # --- Datos del documento ---
    fecha = models.DateField(verbose_name="Fecha de factura")

    moneda = models.CharField(
        max_length=3,
        choices=MONEDA_CHOICES,
        default="USD",
        verbose_name="Moneda",
    )

    tasa_bs_usd = models.DecimalField(
        max_digits=14,
        decimal_places=4,
        null=True,
        blank=True,
        verbose_name="Tasa Bs/USD",
        help_text="Tasa del Banco Central usada al facturar en Bs",
    )
    fecha_tasa = models.DateField(
        null=True,
        blank=True,
        verbose_name="Fecha de la tasa",
        help_text="Fecha de actualización de la tasa BCV",
    )

    # --- Snapshot del cliente (la factura debe quedar inmutable) ---
    cliente_nombre = models.CharField(max_length=150, verbose_name="Cliente")
    cliente_rif = models.CharField(max_length=20, default="", blank=True)
    cliente_encargado = models.CharField(max_length=150, default="", blank=True)
    cliente_telefono = models.CharField(max_length=20, default="", blank=True)
    cliente_direccion = models.CharField(max_length=255, default="", blank=True)
    cliente_correo = models.EmailField(default="", blank=True)

    # --- Estado ---
    estado = models.CharField(
        max_length=20,
        choices=EstadoFactura.choices,
        default=EstadoFactura.EMITIDA,
        verbose_name="Estado",
    )

    # --- Montos (en la moneda de la factura) ---
    porcentaje_descuento = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal("0.00"),
        verbose_name="% Descuento",
    )
    porcentaje_iva = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal("16.00"),
        verbose_name="% IVA",
    )
    monto_iva = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=Decimal("0.00"),
        verbose_name="Monto IVA",
        help_text="Monto de IVA editable, se suma al total",
    )
    subtotal = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=Decimal("0.00"),
        verbose_name="Subtotal",
    )
    monto_descuento = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=Decimal("0.00"),
        verbose_name="Monto descuento",
    )
    total = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=Decimal("0.00"),
        verbose_name="Total",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Factura"
        verbose_name_plural = "Facturas"
        ordering = ["-created_at", "-id"]
        constraints = [
            models.UniqueConstraint(
                fields=["serie", "numero"],
                name="unique_serie_numero_factura",
            )
        ]

    def _generar_numero(self):
        """Genera serie + numero + n_factura (Serie-NNNN) usando FacturaConfig."""
        config = FacturaConfig.objects.first()
        serie = config.serie.strip() if config and config.serie else "A"
        punto_inicio = config.punto_inicio if config and config.punto_inicio else 1

        ultima = Factura.objects.filter(serie=serie).order_by("-numero").first()
        if ultima:
            numero = ultima.numero + 1
        else:
            numero = punto_inicio

        self.serie = serie
        self.numero = numero
        self.n_factura = f"{serie}-{numero:04d}"

    def _snapshot_cliente(self):
        """Copia los datos del cliente del reporte al momento de facturar."""
        if self.reporte_id and self.reporte.cliente_id:
            cliente = self.reporte.cliente
            self.cliente_nombre = cliente.nombre
            self.cliente_rif = cliente.rif or ""
            self.cliente_encargado = cliente.encargado or ""
            self.cliente_telefono = cliente.telefono or ""
            self.cliente_direccion = cliente.direccion or ""
            self.cliente_correo = cliente.correo_electronico or ""

    def save(self, *args, **kwargs):
        if not self.n_factura:
            self._generar_numero()
        self._snapshot_cliente()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Factura {self.n_factura} - {self.cliente_nombre} [{self.get_estado_display()}]"


# ==========================
# FACTURA ↔ REPORTE (multi-presupuesto)
# ==========================


class FacturaReporte(models.Model):
    """
    Vínculo entre una factura y los presupuestos que agrupa (M2M).

    `Factura.reporte` se mantiene como presupuesto PRINCIPAL (el primero que
    se agregó) por compatibilidad con el serializer, el PDF y la lógica de
    pendiente existente. Esta tabla registra el set COMPLETO de presupuestos
    de la factura, incluido el principal.
    """

    factura = models.ForeignKey(
        Factura,
        on_delete=models.CASCADE,
        related_name="reportes_vinculados",
        verbose_name="Factura",
    )
    reporte = models.ForeignKey(
        Reporte,
        on_delete=models.CASCADE,
        related_name="facturas_vinculadas",
        verbose_name="Presupuesto",
    )
    orden = models.PositiveIntegerField(
        default=0,
        verbose_name="Orden",
        help_text="Orden del presupuesto dentro de la factura (0 = principal)",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Presupuesto de Factura"
        verbose_name_plural = "Presupuestos de Factura"
        ordering = ["orden", "id"]
        constraints = [
            models.UniqueConstraint(
                fields=["factura", "reporte"],
                name="unique_factura_reporte",
            )
        ]

    def __str__(self):
        return f"{self.factura.n_factura} → #{self.reporte.n_presupuesto}"


# ==========================
# ITEM DE FACTURA
# ==========================


class FacturaItem(models.Model):
    """
    Línea de una factura.
    Puede estar ligada a un APU del presupuesto (apu completo o parcial)
    o ser una línea manual (apu = null, todo editable).
    """

    factura = models.ForeignKey(
        Factura,
        on_delete=models.CASCADE,
        related_name="items",
    )

    apu = models.ForeignKey(
        APU,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="facturas_items",
        verbose_name="APU",
    )

    apu_descripcion = models.TextField(verbose_name="Descripción")
    unidad = models.CharField(max_length=50, default="", blank=True)
    cantidad = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("1.00"),
        verbose_name="Cantidad",
    )
    precio_unitario = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=Decimal("0.00"),
        verbose_name="Precio unitario",
    )
    total_item = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=Decimal("0.00"),
        verbose_name="Total",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Item de Factura"
        verbose_name_plural = "Items de Factura"
        ordering = ["id"]

    def save(self, *args, **kwargs):
        cantidad = self.cantidad or Decimal("0.00")
        precio = self.precio_unitario or Decimal("0.00")
        self.total_item = (cantidad * precio).quantize(Decimal("0.01"))
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.apu_descripcion[:40]}... x {self.cantidad}"