from django.db import migrations, models
from decimal import Decimal


def crear_empleados(apps, schema_editor):
    Empleado = apps.get_model('inventario', 'Empleado')
    
    empleados = [
        {'descripcion': 'MECANICO', 'unidad': 'DIA', 'cantidad': Decimal('0'), 'precio_unitario': Decimal('25.00'), 'item_fijo': True},
        {'descripcion': 'AYUDANTE MECANICO', 'unidad': 'DIA', 'cantidad': Decimal('0'), 'precio_unitario': Decimal('25.00'), 'item_fijo': True},
        {'descripcion': 'ING INSPECTOR', 'unidad': 'DIA', 'cantidad': Decimal('0'), 'precio_unitario': Decimal('25.00'), 'item_fijo': True},
        {'descripcion': 'SUPERVISOR DE SEGURIDAD INDUSTRIAL', 'unidad': 'DIA', 'cantidad': Decimal('0'), 'precio_unitario': Decimal('25.00'), 'item_fijo': True},
    ]
    
    for e in empleados:
        Empleado.objects.create(**e)


def eliminar_empleados(apps, schema_editor):
    Empleado = apps.get_model('inventario', 'Empleado')
    Empleado.objects.filter(item_fijo=True).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('inventario', '0011_herramienta'),
    ]

    operations = [
        migrations.CreateModel(
            name='Empleado',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('descripcion', models.CharField(max_length=255)),
                ('unidad', models.CharField(default='DIA', max_length=20)),
                ('cantidad', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('precio_unitario', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('item_fijo', models.BooleanField(default=False, help_text='Indica si es un ítem fijo del sistema.')),
            ],
            options={
                'verbose_name': 'Empleado',
                'verbose_name_plural': 'Empleados',
                'ordering': ('descripcion',),
            },
        ),
        migrations.RunPython(crear_empleados, eliminar_empleados),
    ]
