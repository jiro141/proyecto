# inventario/signals.py

from django.db.models.signals import pre_save, post_save, pre_delete
from django.dispatch import receiver
from .models import EPP, Consumible, MovimientoInventario, Taza_pesos_dolares, Stock


# ==========================================================
# 🧩 UTILIDAD GENERAL
# ==========================================================


def set_old_unidades(sender, instance, **kwargs):
    """
    Guarda temporalmente la cantidad anterior de unidades antes de guardar el objeto.
    Esto permite detectar aumentos o reducciones en la cantidad durante una actualización.
    """
    if instance.pk:
        try:
            # Recuperamos la versión anterior del objeto desde la BD
            old_instance = sender.objects.get(pk=instance.pk)
            instance._old_unidades = old_instance.unidades
        except sender.DoesNotExist:
            instance._old_unidades = None
    else:
        instance._old_unidades = None


# ==========================================================
# 🕒 PRE_SAVE — Guardar unidades previas antes de guardar
# ==========================================================


@receiver(pre_save, sender=EPP)
@receiver(pre_save, sender=Consumible)
def save_old_unidades(sender, instance, **kwargs):
    """
    Antes de guardar un EPP o Consumible,
    almacenamos el valor anterior de 'unidades' en una variable temporal.
    """
    set_old_unidades(sender, instance)


# ==========================================================
# 💾 POST_SAVE — Registrar movimiento de inventario
# ==========================================================


@receiver(post_save, sender=EPP)
@receiver(post_save, sender=Consumible)
def crear_movimiento(sender, instance, created, **kwargs):
    """
    Crea automáticamente un registro en MovimientoInventario cada vez que:
      - Se crea un nuevo EPP o Consumible → 'entrada'
      - Se actualiza un registro y cambia el número de unidades → 'entrada' o 'salida'

    🔹 Detecta aumentos o reducciones en las unidades
    🔹 Evita registrar movimientos si no hay cambios
    """
    model_name = sender.__name__.lower()  # "epp" o "consumible"
    old = getattr(instance, "_old_unidades", None)
    new = instance.unidades

    if created:
        # ✅ Caso 1: creación → registrar entrada automática
        if new and new > 0:
            MovimientoInventario.objects.create(
                tipo="entrada",
                cantidad=new,
                **{model_name: instance},
                observacion="Entrada automática por creación",
            )
        return

    # ✅ Caso 2: actualización → comparar diferencia de unidades
    if old is not None:
        diferencia = new - old
        if diferencia > 0:
            # Se agregaron unidades → entrada
            MovimientoInventario.objects.create(
                tipo="entrada",
                cantidad=diferencia,
                **{model_name: instance},
                observacion="Entrada automática por actualización",
            )
        elif diferencia < 0:
            # Se redujeron unidades → salida
            MovimientoInventario.objects.create(
                tipo="salida",
                cantidad=abs(diferencia),
                **{model_name: instance},
                observacion="Salida automática por actualización",
            )
    # Si no hay diferencia → no se registra movimiento


# ==========================================================
# ❌ PRE_DELETE — Registrar salida antes de borrar
# ==========================================================


@receiver(pre_delete, sender=EPP)
@receiver(pre_delete, sender=Consumible)
def registrar_salida_por_borrado(sender, instance, **kwargs):
    """
    Antes de eliminar un EPP o Consumible, se crea automáticamente
    un movimiento de tipo 'salida' para reflejar la pérdida de stock.
    """
    model_name = sender.__name__.lower()
    if instance.unidades and instance.unidades > 0:
        MovimientoInventario.objects.create(
            tipo="salida",
            cantidad=instance.unidades,
            **{model_name: instance},
            observacion="Salida automática por eliminación",
        )


# ==========================================================
# 💱 ACTUALIZAR STOCK TRAS CAMBIO DE TASA
# ==========================================================


@receiver(post_save, sender=Taza_pesos_dolares)
def actualizar_costos_stock(sender, instance, **kwargs):
    """
    Cada vez que se actualiza la tasa de conversión (Taza_pesos_dolares),
    se recalculan automáticamente todos los costos, utilidades y conversiones (mts_ml_m2)
    de los productos en la tabla Stock.

    🔹 Llama a stock.save() para que cada instancia ejecute su lógica de cálculo.
    🔹 Esto garantiza que todos los costos estén siempre sincronizados con la tasa actual.
    """
    stocks = Stock.objects.all()
    for stock in stocks:
        stock.save()  # 🔄 Ejecuta la lógica interna de cálculo definida en Stock.save()
