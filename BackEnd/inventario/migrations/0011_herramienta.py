from django.db import migrations, models
from decimal import Decimal


def crear_herramientas(apps, schema_editor):
    Herramienta = apps.get_model('inventario', 'Herramienta')
    
    herramientas = [
        {'descripcion': 'HERRAMIENTAS MENORES', 'unidad': 'DIA', 'cantidad': Decimal('0'), 'depreciacion_bs_hora': Decimal('9.00'), 'item_fijo': True},
        {'descripcion': 'SOLDADOR TIG', 'unidad': 'DIA', 'cantidad': Decimal('0'), 'depreciacion_bs_hora': Decimal('18.00'), 'item_fijo': True},
        {'descripcion': 'CAMION', 'unidad': 'DIA', 'cantidad': Decimal('0'), 'depreciacion_bs_hora': Decimal('50.00'), 'item_fijo': True},
        {'descripcion': 'MAQUINA ROSCADORA', 'unidad': 'DIA', 'cantidad': Decimal('0'), 'depreciacion_bs_hora': Decimal('20.00'), 'item_fijo': True},
        {'descripcion': 'MAQUINA CILINDRADORA', 'unidad': 'DIA', 'cantidad': Decimal('0'), 'depreciacion_bs_hora': Decimal('60.00'), 'item_fijo': True},
        {'descripcion': 'MAQUINA SATINADORA', 'unidad': 'DIA', 'cantidad': Decimal('0'), 'depreciacion_bs_hora': Decimal('30.00'), 'item_fijo': True},
    ]
    
    for h in herramientas:
        Herramienta.objects.create(**h)


def eliminar_herramientas(apps, schema_editor):
    Herramienta = apps.get_model('inventario', 'Herramienta')
    Herramienta.objects.filter(item_fijo=True).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('inventario', '0010_alter_consumible_options_alter_consumible_descipcion_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='Herramienta',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('descripcion', models.CharField(max_length=255)),
                ('unidad', models.CharField(default='DIA', max_length=20)),
                ('cantidad', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('depreciacion_bs_hora', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('item_fijo', models.BooleanField(default=False, help_text='Indica si es un ítem fijo del sistema.')),
            ],
            options={
                'verbose_name': 'Herramienta',
                'verbose_name_plural': 'Herramientas',
                'ordering': ('descripcion',),
            },
        ),
        migrations.RunPython(crear_herramientas, eliminar_herramientas),
    ]
