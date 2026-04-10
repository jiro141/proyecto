from decimal import Decimal
from django.db.models import Sum
from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
from .services.apu_calculator import recalculate_apu_totals
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
class EstadoChoices(models.TextChoices):
    EN_ESPERA = 'EN_ESPERA', 'En espera'
    APROBADO_ESPERA = 'APROBADO_ESPERA', 'Aprobado en espera de ejecución'
    EJECUTADO = 'EJECUTADO', 'Ejecutado'
    PAGADO = 'PAGADO', 'Pagado'
    CANCELADO = 'CANCELADO', 'Cancelado'


class HistorialEstadoReporte(models.Model):
    """
    Historial de cambios de estado del reporte.
    """
    reporte = models.ForeignKey(
        "Reporte",
        on_delete=models.CASCADE,
        related_name="historial_estados"
    )
    estado_anterior = models.CharField(
        max_length=30,
        choices=EstadoChoices.choices,
        null=True,
        blank=True,
        verbose_name="Estado anterior"
    )
    estado_nuevo = models.CharField(
        max_length=30,
        choices=EstadoChoices.choices,
        verbose_name="Estado nuevo"
    )
    fecha_cambio = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Fecha del cambio"
    )
    observaciones = models.TextField(
        blank=True,
        null=True,
        verbose_name="Observaciones"
    )

    class Meta:
        verbose_name = "Historial de Estado"
        verbose_name_plural = "Historial de Estados"
        ordering = ["-fecha_cambio"]

    def __str__(self):
        return f"{self.reporte.n_presupuesto}: {self.estado_anterior} → {self.estado_nuevo} ({self.fecha_cambio})"

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


class NotaReporte(models.Model):
    reporte = models.ForeignKey(
        "Reporte",
        on_delete=models.CASCADE,
        related_name="notas",  # acceso: reporte.notas.all()
    )

    titulo = models.CharField(
        max_length=150,
        blank=True,
        null=True,
        help_text="Título corto de la nota (ej: 'Ajuste de precios', 'Pendiente de aprobación')",
    )

    descripcion = models.TextField(
        help_text="Detalle de la nota asociada al reporte",
    )

    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-creado_en"]

    def __str__(self):
        base = f"Nota para reporte {self.reporte.n_presupuesto}"
        return f"{self.titulo} - {base}" if self.titulo else base


# ==========================
# REPORTE
# ==========================


class Reporte(models.Model):
    """
    Un reporte agrupa múltiples APUs y gestiona su ciclo de vida operativo y financiero.
    """

    cliente = models.ForeignKey(
        Cliente, 
        on_delete=models.CASCADE, 
        related_name="reportes"
    )

    n_presupuesto = models.CharField(
        max_length=50,
        unique=True,
        editable=False,
        verbose_name="Número de presupuesto",
    )

    orden_servicio = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name="Orden de Servicio",
        help_text="Número de orden de servicio (opcional)",
    )

    descripcion = models.TextField(blank=True, null=True)

    fecha_creacion = models.DateTimeField(
        default=timezone.now,
        verbose_name="Fecha de creación",
    )

    estado = models.CharField(
        max_length=300,
        choices=EstadoChoices.choices,
        default=EstadoChoices.EN_ESPERA,
        help_text="Estado detallado del ciclo de vida del reporte"
    )

    total_reporte = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=Decimal("0.00"),
        help_text="Suma de total_apu de todos los APUs vinculados",
    )

    class Meta:
        ordering = ["-fecha_creacion", "-id"]
        verbose_name = "Reporte"
        verbose_name_plural = "Reportes"

    @property
    def saldo_pendiente(self):
        """
        Calcula cuánto falta por pagar restando los abonos del total del reporte.
        """
        # Intentamos obtener la suma de los abonos relacionados
        total_abonado = self.abonos.aggregate(total=Sum('monto'))['total'] or Decimal('0.00')
        return (self.total_reporte - total_abonado).quantize(Decimal("0.01"))

    def save(self, *args, **kwargs):
        """
        Genera n_presupuesto autoincremental usando ReporteConfig.
        Registra cambio de estado en historial.
        """
        # Verificar si es un registro nuevo o si cambió el estado
        es_nuevo = self._state.adding
        estado_anterior = None
        
        if not es_nuevo:
            # Obtener el estado anterior de la base de datos
            try:
                reporte_old = Reporte.objects.get(pk=self.pk)
                estado_anterior = reporte_old.estado
            except Reporte.DoesNotExist:
                pass
        
        # Generar n_presupuesto si es nuevo
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

        # Guardar el reporte primero
        super().save(*args, **kwargs)
        
        # Registrar cambio de estado en historial
        if not es_nuevo and estado_anterior and estado_anterior != self.estado:
            HistorialEstadoReporte.objects.create(
                reporte=self,
                estado_anterior=estado_anterior,
                estado_nuevo=self.estado,
                observaciones=f"Cambio de estado automático"
            )

    def recalcular_total(self):
        """
        Suma el presupuesto_base de todos los APUs relacionados, actualiza el total 
        y verifica si el estado debe pasar a Pagado.
        """
        # 1. Sumar APUs usando presupuesto_base (ya incluye cantidad)
        total_apus = self.apus.aggregate(total=Sum("presupuesto_base"))["total"] or Decimal("0.00")
        self.total_reporte = total_apus.quantize(Decimal("0.01"))
        
        # 2. Lista de campos a actualizar
        campos_a_actualizar = ["total_reporte"]
        
        # 3. Lógica automática de pago: Si el saldo es 0 o menor, y ya estaba ejecutado
        estado_anterior = self.estado
        if self.total_reporte > 0 and self.saldo_pendiente <= 0:
            if self.estado == EstadoChoices.EJECUTADO:
                self.estado = EstadoChoices.PAGADO
                campos_a_actualizar.append("estado")

        self.save(update_fields=campos_a_actualizar)
        
        # Registrar cambio de estado en historial si hubo cambio
        if "estado" in campos_a_actualizar and estado_anterior != self.estado:
            HistorialEstadoReporte.objects.create(
                reporte=self,
                estado_anterior=estado_anterior,
                estado_nuevo=self.estado,
                observaciones="Cambio de estado por pago total"
            )
        
        return self.total_reporte

    def __str__(self):
        return f"Presupuesto {self.n_presupuesto} - {self.cliente.nombre} [{self.get_estado_display()}]"
    
# ==========================
# APU
# ==========================


class APU(models.Model):
    """
    APU asociado a un Reporte.
    """

    reporte = models.ForeignKey(
        "Reporte", on_delete=models.CASCADE, related_name="apus"
    )

    numero = models.PositiveIntegerField(null=True, blank=True)
    presupuesto_base = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
        help_text="Presupuesto base calculado o asignado manualmente",
    )

    rendimiento = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        default=Decimal("1.000"),
        help_text="Valor de rendimiento (sin límite de rango)",
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
    presupuesto_con_desp = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
        help_text="Presupuesto base considerando la depreciación (%) del APU",
    )

    # === Campos calculados / totales ===
    precio_unitario = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0.00")
    )
    total_base = models.DecimalField(
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
        if self.numero is None and self.reporte_id:
            ultimo = (
                APU.objects.filter(reporte=self.reporte).order_by("-numero").first()
            )
            self.numero = (ultimo.numero + 1) if ultimo and ultimo.numero else 1

        super().save(*args, **kwargs)

    def recalcular_totales(self):
        """
        Delegar el cálculo al servicio de dominio.
        """
        recalculate_apu_totals(self)

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
        help_text="Porcentaje de desperdicio individual del material",
    )
    precio_unitario = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0.00")
    )
    total_material = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0.00")
    )

    def save(self, *args, **kwargs):
        # --- Obtener info desde inventario ---
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

        # --- Cálculo correcto ---
        # total_material = cantidad × (1 + desperdicio/100) × precio_unitario
        cantidad_total = self.cantidad * (
            Decimal("1.00") + (self.desperdicio / Decimal("100.00"))
        )
        self.total_material = (self.precio_unitario * cantidad_total).quantize(
            Decimal("0.01")
        )

        super().save(*args, **kwargs)

        # Recalcular totales del APU al que pertenece
        if self.apu_id:
            self.apu.recalcular_totales()

    def __str__(self):
        return f"Material {self.descripcion or ''} (APU {self.apu.numero})"


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
