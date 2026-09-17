from django.core.management.base import BaseCommand
from django.db.models import Count
from reportes.models import Cliente


class Command(BaseCommand):
    help = "Compara dos clientes con el mismo nombre y muestra los reportes asociados de cada uno"

    def add_arguments(self, parser):
        parser.add_argument(
            "nombre",
            type=str,
            help="Nombre del cliente a buscar (se buscan todos los clientes con ese nombre)",
        )

    def handle(self, *args, **options):
        nombre = options["nombre"]

        self.stdout.write(self.style.WARNING(f"=== COMPARAR CLIENTES CON NOMBRE: '{nombre}' ===\n"))

        clientes = Cliente.objects.filter(nombre__iexact=nombre).prefetch_related(
            "reportes", "reportes__apus"
        )

        if clientes.count() < 2:
            self.stdout.write(
                self.style.WARNING(
                    f"⚠️  Solo se encontró {clientes.count()} cliente(s) con ese nombre. "
                    "No hay duplicados que comparar."
                )
            )
            return

        self.stdout.write(f"📊 Se encontraron {clientes.count()} clientes con ese nombre:\n")

        for i, cliente in enumerate(clientes, 1):
            reportes = cliente.reportes.all()
            total_reportes = reportes.count()
            total_apus = sum(r.apus.count() for r in reportes)
            total_monto = sum(float(r.total_reporte or 0) for r in reportes)

            self.stdout.write(self.style.SUCCESS(f"┌─── CLIENTE {i} ─── ID: {cliente.id} ───"))
            self.stdout.write(f"│ Nombre:      {cliente.nombre}")
            self.stdout.write(f"│ RIF:         {cliente.rif}")
            self.stdout.write(f"│ Encargado:   {cliente.encargado}")
            self.stdout.write(f"│ Teléfono:    {cliente.telefono}")
            self.stdout.write(f"│ Dirección:   {cliente.direccion}")
            self.stdout.write(f"│ Correo:      {cliente.correo_electronico}")
            self.stdout.write(f"│")
            self.stdout.write(f"│ 📋 Reportes: {total_reportes}")
            self.stdout.write(f"│ 🔧 APUs:     {total_apus}")
            self.stdout.write(f"│ 💰 Total:    ${total_monto:,.2f}")

            if total_reportes > 0:
                self.stdout.write(f"│")
                self.stdout.write(f"│ {'#':<6} {'Presupuesto':<15} {'Estado':<20} {'Total':>12}")
                self.stdout.write(f"│ {'─'*6} {'─'*15} {'─'*20} {'─'*12}")
                for r in reportes:
                    self.stdout.write(
                        f"│ {r.id:<6} {r.n_presupuesto:<15} {r.get_estado_display():<20} ${float(r.total_reporte or 0):>10,.2f}"
                    )

            self.stdout.write(f"└{'─'*60}\n")

        # Resumen comparativo
        self.stdout.write(self.style.WARNING("=== RESUMEN COMPARATIVO ===\n"))
        for i, cliente in enumerate(clientes, 1):
            reportes = cliente.reportes.all()
            self.stdout.write(
                f"  Cliente {i} (ID {cliente.id}, RIF {cliente.rif}): "
                f"{reportes.count()} reporte(s)"
            )
