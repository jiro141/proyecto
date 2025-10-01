# inventario/signals.py

from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from .models import Stock, EPP, Consumible, MovimientoInventario

# Utilidad: guardar la cantidad previa en la instancia
def set_old_unidades(sender, instance, **kwargs):
    if instance.pk:
        try:
            old_instance = sender.objects.get(pk=instance.pk)
            instance._old_unidades = old_instance.unidades
        except sender.DoesNotExist:
            instance._old_unidades = None
    else:
        instance._old_unidades = None

# PRE_SAVE: Guardar la cantidad anterior antes de cualquier cambio
@receiver(pre_save, sender=Stock)
@receiver(pre_save, sender=EPP)
@receiver(pre_save, sender=Consumible)
def save_old_unidades(sender, instance, **kwargs):
    set_old_unidades(sender, instance)

# POST_SAVE: Crear movimiento automáticamente
@receiver(post_save, sender=Stock)
@receiver(post_save, sender=EPP)
@receiver(post_save, sender=Consumible)
def crear_movimiento(sender, instance, created, **kwargs):
    # Obtener modelo relacionado para MovimientoInventario
    model_name = sender.__name__.lower()  # 'stock', 'epp', 'consumible'

    # Unidades anterior y nueva
    old = getattr(instance, '_old_unidades', None)
    new = instance.unidades

    # Cuando se crea el objeto (entrada)
    if created:
        if new and new > 0:
            MovimientoInventario.objects.create(
                tipo='entrada',
                cantidad=new,
                **{model_name: instance},
                observacion='Entrada automática por creación'
            )
        return

    # Cuando se edita el objeto
    if old is not None:
        diferencia = new - old
        if diferencia > 0:
            # Entrada
            MovimientoInventario.objects.create(
                tipo='entrada',
                cantidad=diferencia,
                **{model_name: instance},
                observacion='Entrada automática por actualización'
            )
        elif diferencia < 0:
            # Salida
            MovimientoInventario.objects.create(
                tipo='salida',
                cantidad=abs(diferencia),
                **{model_name: instance},
                observacion='Salida automática por actualización'
            )
    # Si diferencia == 0, no crear movimiento
