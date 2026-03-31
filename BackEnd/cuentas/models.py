from django.db import models
from django.utils import timezone
from decimal import Decimal
from reportes.models import Cliente, ReporteConfig

class EstadoChoices(models.TextChoices):
    # Estados de Negociación (Previos)
    EN_ESPERA = 'ESPERA', 'En espera'
    RECHAZADO = 'RECHAZADO', 'Rechazado' # Presupuesto no aceptado por el cliente
    
    # === Estados Derivados de Aprobación (Fase Operativa) ===
    APROBADO_ESPERA = 'APROBADO_ESPERA', 'Aprobado a espera de ejecución'
    EJECUTADO = 'EJECUTADO', 'Ejecutado'
    EJECUTADO_POR_PAGAR = 'EJECUTADO_POR_PAGAR', 'Ejecutado Por pagar'
    EJECUTADO_PAGADO = 'EJECUTADO_PAGADO', 'Ejecutado Pagado'

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

    descripcion = models.TextField(blank=True, null=True)

    fecha_creacion = models.DateTimeField(
        default=timezone.now,
        verbose_name="Fecha de creación",
    )
    
    estado = models.CharField(
        max_length=30, # Aumentado para soportar los strings más largos
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
        """Calcula cuánto falta por pagar de este reporte"""
        total_abonado = self.abonos.aggregate(
            total=models.Sum('monto')
        )['total'] or Decimal('0.00')
        return self.total_reporte - total_abonado
    
    def save(self, *args, **kwargs):
        """
        Genera n_presupuesto autoincremental usando ReporteConfig.
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
        Suma el valor final (total_apu) de todos los APUs relacionados
        y actualiza el estado si el reporte ha sido totalmente pagado.
        """
        # 1. Calcular la suma de todos los APUs asociados
        # Usamos Sum importado de django.db.models
        resultado_apus = self.apus.aggregate(total=Sum("total_apu"))
        total_apus = resultado_apus["total"] or Decimal("0.00")
        
        self.total_reporte = total_apus.quantize(Decimal("0.01"))
        
        # 2. Calcular cuánto se ha pagado (Abonos)
        resultado_abonos = self.abonos.aggregate(total=Sum("monto"))
        total_abonado = resultado_abonos["total"] or Decimal("0.00")

        campos_a_actualizar = ["total_reporte"]

        # 3. Cambio de estado automático
        # Solo disparamos el estado 'Pagado' si hay dinero de por medio y el reporte no está anulado
        if self.total_reporte > 0 and total_abonado >= self.total_reporte:
            estados_validos_para_pagar = [
                EstadoChoices.APROBADO_ESPERA,
                EstadoChoices.EJECUTADO,
                EstadoChoices.EJECUTADO_POR_PAGAR
            ]
            if self.estado in estados_validos_para_pagar:
                self.estado = EstadoChoices.EJECUTADO_PAGADO
                campos_a_actualizar.append("estado")

        # 4. Guardado eficiente
        self.save(update_fields=campos_a_actualizar)
        return self.total_reporte

    def __str__(self):
        return f"Presupuesto {self.n_presupuesto} - {self.cliente.nombre} [{self.get_estado_display()}]"
    
class Abono(models.Model):
    """
    Registro de abonos financieros vinculados a un reporte específico.
    """

    # 1. Relación con el Reporte (Código y Descripción)
    reporte = models.ForeignKey(
        "Reporte", 
        on_delete=models.CASCADE, 
        related_name="abonos",
        verbose_name="Reporte asociado"
    )

    # 2. Monto del pago
    monto = models.DecimalField(
        max_digits=14, 
        decimal_places=2, 
        default=Decimal("0.00"),
        verbose_name="Monto abonado"
    )

    # 3. Número de Referencia (Opcional)
    referencia_pago = models.CharField(
        max_length=100, 
        blank=True, 
        null=True, 
        verbose_name="Número de Referencia",
        help_text="Opcional: ID de transacción, número de transferencia o cheque"
    )

    # 4. Fecha del registro
    fecha_abono = models.DateTimeField(
        default=timezone.now,
        verbose_name="Fecha de Abono"
    )

    class Meta:
        verbose_name = "Abono"
        verbose_name_plural = "Abonos"
        ordering = ["-fecha_abono"]

    # --- Propiedad para acceder a la descripción del reporte sin duplicar datos ---
    @property
    def descripcion_del_reporte(self):
        return self.reporte.descripcion

    def __str__(self):
        ref = self.referencia_pago if self.referencia_pago else "S/N"
        return f"Abono {self.reporte.n_presupuesto} - Ref: {ref} (${self.monto})"