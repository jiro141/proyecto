# inventario/signals.py

from django.db.models.signals import pre_save, post_save, pre_delete
from django.dispatch import receiver
from .models import Stock, EPP, Consumible, MovimientoInventario

# -------------------------
# Utilidad: guardar unidades previas
# -------------------------
def set_old_unidades(sender, instance, **kwargs):
    if instance.pk:
        try:
            old_instance = sender.objects.get(pk=instance.pk)
            instance._old_unidades = old_instance.unidades
        except sender.DoesNotExist:
            instance._old_unidades = None
    else:
        instance._old_unidades = None


# -------------------------
# PRE_SAVE → guardar estado previo antes de modificar
# -------------------------
@receiver(pre_save, sender=Stock)
@receiver(pre_save, sender=EPP)
@receiver(pre_save, sender=Consumible)
def save_old_unidades(sender, instance, **kwargs):
    set_old_unidades(sender, instance)


# -------------------------
# POST_SAVE → registrar movimientos en creación o actualización
# -------------------------
@receiver(post_save, sender=Stock)
@receiver(post_save, sender=EPP)
@receiver(post_save, sender=Consumible)
def crear_movimiento(sender, instance, created, **kwargs):
    model_name = sender.__name__.lower()  # stock / epp / consumible
    old = getattr(instance, "_old_unidades", None)
    new = instance.unidades

    if created:
        # Al crear un registro → entrada
        if new and new > 0:
            MovimientoInventario.objects.create(
                tipo="entrada",
                cantidad=new,
                **{model_name: instance},
                observacion="Entrada automática por creación",
            )
        return

    # Actualización → comparar diferencias
    if old is not None:
        diferencia = new - old
        if diferencia > 0:
            MovimientoInventario.objects.create(
                tipo="entrada",
                cantidad=diferencia,
                **{model_name: instance},
                observacion="Entrada automática por actualización",
            )
        elif diferencia < 0:
            MovimientoInventario.objects.create(
                tipo="salida",
                cantidad=abs(diferencia),
                **{model_name: instance},
                observacion="Salida automática por actualización",
            )
    # Si no cambia la cantidad → no registrar


# -------------------------
# PRE_DELETE → registrar salida antes de borrar
# -------------------------
@receiver(pre_delete, sender=Stock)
@receiver(pre_delete, sender=EPP)
@receiver(pre_delete, sender=Consumible)
def registrar_salida_por_borrado(sender, instance, **kwargs):
    model_name = sender.__name__.lower()
    if instance.unidades and instance.unidades > 0:
        MovimientoInventario.objects.create(
            tipo="salida",
            cantidad=instance.unidades,
            **{model_name: instance},
            observacion="Salida automática por eliminación",
        )
