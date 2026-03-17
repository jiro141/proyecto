from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Stock, Taza_pesos_dolares


@receiver(post_save, sender=Taza_pesos_dolares)
def actualizar_costos_stock(sender, instance, **kwargs):
    """
    Recalcula automáticamente los costos de todos los items Stock
    cuando cambia la tasa de pesos/dólares.
    """
    stocks = Stock.objects.all()

    for item in stocks:
        if not item.costo_dolares:
            item.calcular_costos()
            item.save(
                update_fields=[
                    "costo",
                    "costo_5",
                    "costo_15",
                    "costo_20",
                    "mts_ml_m2",
                ]
            )