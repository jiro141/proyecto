from decimal import Decimal

from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator

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
    """
    Define desde qué número empieza la numeración de N_presupuesto.
    """

    punto_inicio = models.PositiveIntegerField(null=True, blank=True)

    def __str__(self):
        return f"Punto de inicio: {self.punto_inicio or 'Sin definir'}"

    class Meta:
        verbose_name = "Configuración de Reportes"
        verbose_name_plural = "Configuración de Reportes"


# ==========================
# REPORTE
# ==========================


class Reporte(models.Model):
    """
    Un reporte agrupa múltiples APUs.
    """

    cliente = models.ForeignKey(
        Cliente, on_delete=models.CASCADE, related_name="reportes"
    )

    n_presupuesto = models.CharField(
        max_length=50,
        unique=True,
        editable=False,
        verbose_name="Número de presupuesto",
    )

    descripcion = models.TextField(blank=True, null=True)

    fecha_creacion = models.DateTimeField(
        default=timezone.now,
        verbose_name="Fecha de creación",
    )

    # 🔢 Total del reporte (suma de total_apu)
    total_reporte = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=Decimal("0.00"),
        help_text="Suma de total_apu de todos los APUs del reporte",
    )

    class Meta:
        ordering = ["-fecha_creacion", "-id"]
        verbose_name = "Reporte"
        verbose_name_plural = "Reportes"

    def save(self, *args, **kwargs):
        """
        Genera n_presupuesto autoincremental usando ReporteConfig
        la primera vez que se guarda.
        """
        if not self.n_presupuesto:
            config = ReporteConfig.objects.first()
            punto_inicio = config.punto_inicio if config and config.punto_inicio else 1
            ultimo = Reporte.objects.order_by("-id").first()

            if ultimo:
                try:
                    self.n_presupuesto = str(int(ultimo.n_presupuesto) + 1)
                except (ValueError, TypeError):
                    self.n_presupuesto = str(punto_inicio)
            else:
                self.n_presupuesto = str(punto_inicio)

        super().save(*args, **kwargs)

    def recalcular_total(self):
        """
        Suma el total_apu de todos los APUs relacionados y guarda el resultado.
        """
        total = self.apus.aggregate(total=models.Sum("total_apu"))["total"] or Decimal(
            "0.00"
        )
        self.total_reporte = total.quantize(Decimal("0.01"))
        self.save(update_fields=["total_reporte"])
        return self.total_reporte

    def __str__(self):
        return f"Presupuesto {self.n_presupuesto} - {self.cliente.nombre}"


# ==========================
# APU
# ==========================


class APU(models.Model):
    """
    APU asociado a un Reporte.
    """

    reporte = models.ForeignKey(Reporte, on_delete=models.CASCADE, related_name="apus")

    # Número APU dentro del reporte (1,2,3...) – se reinicia por reporte
    # 👉 puede ser null al principio; se calcula en save()
    numero = models.PositiveIntegerField(null=True, blank=True)

    rendimiento = models.DecimalField(
        max_digits=5,
        decimal_places=3,
        default=Decimal("1.000"),
        validators=[MinValueValidator(0), MaxValueValidator(1)],
        help_text="Valor entre 0 y 1",
    )

    descripcion = models.CharField(
        max_length=255,
        default="Sin descripción",
        blank=True,
        null=True,
    )

    unidad = models.CharField(max_length=50, blank=True, null=True)

    cantidad = models.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal("1.00")
    )

    depreciacion = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=Decimal("0.00"),
        help_text="Depreciación general del APU (si aplica)",
    )

    # === Campos calculados / totales ===
    precio_unitario = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0.00")
    )
    total_base = models.DecimalField(  # costo directo por unidad
        max_digits=12, decimal_places=2, default=Decimal("0.00")
    )

    total_materiales = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0.00")
    )
    total_herramientas = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0.00")
    )
    total_mano_obra = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0.00")
    )
    total_logistica = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0.00")
    )

    bono_alimenticio = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
        help_text="15$ por día por cada trabajador",
    )
    prestaciones_sociales = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
        help_text="Total mano de obra * 200",
    )
    costo_por_unidad = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
        help_text="Prestaciones sociales / rendimiento",
    )
    costo_directo_por_unidad = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
        help_text="Costo por unidad + costo total herramientas + costo total materiales",
    )
    gastos_administrativos_15 = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
        help_text="15% de gastos administrativos",
    )
    subtotal = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
        help_text="Costo directo por unidad + gastos administrativos",
    )
    utilidad_15 = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
        help_text="15% de utilidad sobre el subtotal",
    )
    total_apu = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
        help_text="Subtotal + utilidad",
    )

    fecha_creacion = models.DateTimeField(default=timezone.now)

    class Meta:
        verbose_name = "APU"
        verbose_name_plural = "APUs"
        constraints = [
            models.UniqueConstraint(
                fields=["reporte", "numero"], name="unique_apu_numero_por_reporte"
            )
        ]
        ordering = ["reporte", "numero"]

    def save(self, *args, **kwargs):
        # Asignar número correlativo si no está definido
        if self.numero is None:
            ultimo = (
                APU.objects.filter(reporte=self.reporte).order_by("-numero").first()
            )
            self.numero = (ultimo.numero + 1) if ultimo and ultimo.numero else 1

        super().save(*args, **kwargs)

    # ---------- Cálculos ----------

    def recalcular_totales(self):
        """
        Recalcula todos los totales del APU y actualiza el total del reporte.
        """
        # Totales de materiales
        self.total_materiales = sum(
            m.total_material for m in self.materiales.all()
        ) or Decimal("0.00")

        # Totales de herramientas
        self.total_herramientas = sum(
            h.total_herramienta for h in self.herramientas.all()
        ) or Decimal("0.00")

        # Totales de mano de obra
        self.total_mano_obra = sum(
            mo.total_mano_obra for mo in self.manos_obra.all()
        ) or Decimal("0.00")

        # Totales de logística
        self.total_logistica = sum(
            l.total_logistica for l in self.logisticas.all()
        ) or Decimal("0.00")

        # Bono alimenticio: 15$ por día por trabajador
        total_trabajadores = sum(
            mo.cantidad for mo in self.manos_obra.all()
        ) or Decimal("0.00")
        self.bono_alimenticio = (Decimal("15.00") * total_trabajadores).quantize(
            Decimal("0.01")
        )

        # Prestaciones sociales = total mano de obra * 200
        self.prestaciones_sociales = (
            self.total_mano_obra * Decimal("200.00")
        ).quantize(Decimal("0.01"))

        # Costo por unidad = prestaciones sociales / rendimiento
        if self.rendimiento and self.rendimiento > 0:
            self.costo_por_unidad = (
                self.prestaciones_sociales / self.rendimiento
            ).quantize(Decimal("0.01"))
        else:
            self.costo_por_unidad = Decimal("0.00")

        # Costo directo por unidad
        self.costo_directo_por_unidad = (
            self.costo_por_unidad + self.total_herramientas + self.total_materiales
        ).quantize(Decimal("0.01"))

        # 15% de gastos administrativos
        self.gastos_administrativos_15 = (
            self.costo_directo_por_unidad * Decimal("0.15")
        ).quantize(Decimal("0.01"))

        # Subtotal = costo directo + gastos administrativos
        self.subtotal = (
            self.costo_directo_por_unidad + self.gastos_administrativos_15
        ).quantize(Decimal("0.01"))

        # 15% de utilidad
        self.utilidad_15 = (self.subtotal * Decimal("0.15")).quantize(Decimal("0.01"))

        # Total APU
        self.total_apu = (self.subtotal + self.utilidad_15).quantize(Decimal("0.01"))

        # total_base: costo directo por unidad
        self.total_base = self.costo_directo_por_unidad

        # precio unitario = total APU
        self.precio_unitario = self.total_apu

        self.save(
            update_fields=[
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
                "total_base",
                "precio_unitario",
            ]
        )

        # Actualizar total del reporte
        if self.reporte_id:
            self.reporte.recalcular_total()

    def __str__(self):
        return f"APU {self.numero} - {self.descripcion} (Presupuesto {self.reporte.n_presupuesto})"


# ==========================
# MATERIALES (COSTO DE MATERIALES)
# ==========================


class APUMaterial(models.Model):
    """
    Costo de materiales por APU.
    """

    apu = models.ForeignKey(APU, on_delete=models.CASCADE, related_name="materiales")

    stock = models.ForeignKey(Stock, on_delete=models.SET_NULL, null=True, blank=True)
    consumible = models.ForeignKey(
        Consumible, on_delete=models.SET_NULL, null=True, blank=True
    )

    descripcion = models.CharField(max_length=255, blank=True, null=True)
    unidad = models.CharField(max_length=50, blank=True, null=True)
    cantidad = models.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal("1.00")
    )
    desperdicio = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=Decimal("0.00"),
        help_text="Desperdicio en % o unidad que definas",
    )
    precio_unitario = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0.00")
    )
    total_material = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0.00")
    )

    def save(self, *args, **kwargs):
        # Traer datos desde inventario si aplica
        if self.stock:
            self.descripcion = self.stock.descripcion
            self.unidad = getattr(self.stock, "pza", "UND")

            mts_ml_m2 = getattr(self.stock, "mts_ml_m2", None)
            utilidad_15 = getattr(self.stock, "utilidad_15", None)

            if mts_ml_m2:
                self.precio_unitario = Decimal(mts_ml_m2)
            elif utilidad_15:
                self.precio_unitario = Decimal(utilidad_15)
            else:
                self.precio_unitario = Decimal("0.00")

        elif self.consumible:
            self.descripcion = self.consumible.descripcion
            self.unidad = "UND"
            self.precio_unitario = Decimal(self.consumible.costo or 0)

        self.total_material = (self.precio_unitario * self.cantidad).quantize(
            Decimal("0.01")
        )

        super().save(*args, **kwargs)

        if self.apu_id:
            self.apu.recalcular_totales()

    def __str__(self):
        return f"Material {self.descripcion} (APU {self.apu.numero})"


# ==========================
# HERRAMIENTAS (COSTO DE HERRAMIENTAS)
# ==========================


class APUHerramienta(models.Model):
    """
    Costo de herramientas por APU.
    """

    apu = models.ForeignKey(APU, on_delete=models.CASCADE, related_name="herramientas")

    descripcion = models.CharField(max_length=255, blank=True, null=True)
    unidad = models.CharField(max_length=50, blank=True, null=True)
    cantidad = models.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal("1.00")
    )
    depreciacion_hora = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal("0.00"),
        help_text="Depreciación por hora",
    )
    precio_unitario = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0.00")
    )
    total_herramienta = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0.00")
    )

    def save(self, *args, **kwargs):
        self.total_herramienta = (self.precio_unitario * self.cantidad).quantize(
            Decimal("0.01")
        )

        super().save(*args, **kwargs)

        if self.apu_id:
            self.apu.recalcular_totales()

    def __str__(self):
        return f"Herramienta {self.descripcion} (APU {self.apu.numero})"


# ==========================
# MANO DE OBRA
# ==========================


class APUManoObra(models.Model):
    """
    Mano de obra por APU.
    """

    apu = models.ForeignKey(APU, on_delete=models.CASCADE, related_name="manos_obra")

    descripcion = models.CharField(max_length=255, blank=True, null=True)
    unidad = models.CharField(max_length=50, blank=True, null=True)
    cantidad = models.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal("1.00")
    )
    precio_unitario = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0.00")
    )
    total_mano_obra = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0.00")
    )

    def save(self, *args, **kwargs):
        self.total_mano_obra = (self.precio_unitario * self.cantidad).quantize(
            Decimal("0.01")
        )

        super().save(*args, **kwargs)

        if self.apu_id:
            self.apu.recalcular_totales()

    def __str__(self):
        return f"MO {self.descripcion} (APU {self.apu.numero})"


# ==========================
# LOGÍSTICA
# ==========================


class APULogistica(models.Model):
    """
    Conceptos de logística por APU.
    """

    apu = models.ForeignKey(APU, on_delete=models.CASCADE, related_name="logisticas")

    descripcion = models.CharField(max_length=255, blank=True, null=True)
    unidad = models.CharField(max_length=50, blank=True, null=True)
    cantidad = models.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal("1.00")
    )
    precio_unitario = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0.00")
    )
    total_logistica = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0.00")
    )

    def save(self, *args, **kwargs):
        self.total_logistica = (self.precio_unitario * self.cantidad).quantize(
            Decimal("0.01")
        )

        super().save(*args, **kwargs)

        if self.apu_id:
            self.apu.recalcular_totales()

    def __str__(self):
        return f"Logística {self.descripcion} (APU {self.apu.numero})"
