from django.db import models


class LugarConsumo(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name


class Ubicacion(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name


class Departamento(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name


class EPP(models.Model):
    name = models.CharField(max_length=100)
    unidades = models.IntegerField()
    monto = models.FloatField()

    def __str__(self):
        return self.name


class Stock(models.Model):
    name = models.CharField(max_length=100)
    modelo = models.CharField(max_length=100)
    departamento = models.ForeignKey(Departamento, on_delete=models.CASCADE)
    unidades = models.IntegerField()
    monto = models.FloatField()

    def __str__(self):
        return self.name


class Consumible(models.Model):
    name = models.CharField(max_length=100)
    modelo = models.CharField(max_length=100)
    departamento = models.ForeignKey(Departamento, on_delete=models.CASCADE)
    unidades = models.IntegerField()
    monto = models.FloatField()
    consumo = models.ForeignKey(LugarConsumo, on_delete=models.CASCADE)
    ubicacion = models.ForeignKey(Ubicacion, on_delete=models.CASCADE)

    def __str__(self):
        return self.name


class Proveedor(models.Model):
    name = models.CharField(max_length=100)
    direccion = models.CharField(max_length=255)
    telefono = models.CharField(max_length=20)
    consumible = models.ForeignKey(Consumible, on_delete=models.CASCADE)
    stock = models.ForeignKey(Stock, on_delete=models.CASCADE)
    epp = models.ForeignKey(EPP, on_delete=models.CASCADE)

    def __str__(self):
        return self.name


class MovimientoInventario(models.Model):
    TIPO_CHOICES = (
        ('entrada', 'Entrada'),
        ('salida', 'Salida'),
        ('ajuste', 'Ajuste'),
    )

    fecha = models.DateTimeField(auto_now_add=True)
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES)
    cantidad = models.IntegerField()
    observacion = models.TextField(blank=True)

    stock = models.ForeignKey(
        Stock, on_delete=models.CASCADE, null=True, blank=True)
    epp = models.ForeignKey(
        EPP, on_delete=models.CASCADE, null=True, blank=True)
    consumible = models.ForeignKey(
        Consumible, on_delete=models.CASCADE, null=True, blank=True)

    def __str__(self):
        producto = self.stock or self.epp or self.consumible
        return f"{self.tipo.upper()} - {producto} - {self.cantidad}u - {self.fecha.strftime('%d/%m/%Y')}"



