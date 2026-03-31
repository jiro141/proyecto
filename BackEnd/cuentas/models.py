from django.db import models
from django.utils import timezone
from decimal import Decimal
# IMPORTANTE: Solo importamos, NO re-definimos la clase aquí
from reportes.models import Reporte 

class Abono(models.Model):
    """
    Registro de abonos financieros vinculados a un reporte específico.
    """

    # 1. Relación con el Reporte (Usando el modelo importado)
    reporte = models.ForeignKey(
        Reporte, 
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

    @property
    def descripcion_del_reporte(self):
        return self.reporte.descripcion

    def __str__(self):
        ref = self.referencia_pago if self.referencia_pago else "S/N"
        return f"Abono {self.reporte.n_presupuesto} - Ref: {ref} (${self.monto})"