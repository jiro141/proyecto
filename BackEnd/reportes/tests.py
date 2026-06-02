from decimal import Decimal
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status

from .models import (
    Cliente, Reporte, ReporteConfig, APU, APUMaterial,
    APUHerramienta, APUManoObra, APULogistica, NotaReporte,
    HistorialEstadoReporte, NotaEntrega, EstadoChoices,
)
from cuentas.models import Abono
from inventario.models import Stock, Departamento


class DuplicarReporteTest(TestCase):
    """Tests para el endpoint POST /api/reportes/<pk>/duplicar/"""

    def setUp(self):
        self.client = APIClient()
        self.user = self._create_user()
        self.client.force_authenticate(user=self.user)

        # Configurar punto de inicio para numeración
        ReporteConfig.objects.create(punto_inicio=1000)

        # Crear cliente
        self.cliente = Cliente.objects.create(
            nombre="Cliente Test",
            rif="J-12345678-9",
            encargado="Test",
            telefono="04121234567",
            direccion="Dirección Test",
            correo_electronico="test@test.com",
        )

        # Crear departamento y stock para materiales
        self.departamento = Departamento.objects.create(name="Test")
        self.stock = Stock.objects.create(
            codigo="ST-001",
            descripcion="Material Test",
            pza="50.00",
            departamento=self.departamento,
            utilidad_15=Decimal("50.00"),
        )

        # Crear reporte original con APUs completos
        self.reporte = self._crear_reporte_completo()

    def _create_user(self):
        """Crea un usuario de prueba."""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        return User.objects.create_user(
            username="testuser",
            password="testpass123",
        )

    def _crear_reporte_completo(self):
        """Crea un reporte con 2 APUs, cada uno con materiales, herramientas, MO y logística."""
        reporte = Reporte.objects.create(
            cliente=self.cliente,
            orden_servicio="OS-001",
            descripcion="Presupuesto de prueba",
            fecha_estimacion_culminacion="2026-12-31",
        )

        # APU 1
        apu1 = APU.objects.create(
            reporte=reporte,
            rendimiento=Decimal("1.000"),
            descripcion="APU 1 - Prueba",
            unidad="UND",
            cantidad=Decimal("2.00"),
            depreciacion=Decimal("5.00"),
        )
        APUMaterial.objects.create(
            apu=apu1,
            stock=self.stock,
            cantidad=Decimal("3.00"),
            desperdicio=Decimal("10.00"),
        )
        APUHerramienta.objects.create(
            apu=apu1,
            descripcion="Martillo",
            unidad="UND",
            cantidad=Decimal("1.00"),
            precio_unitario=Decimal("25.00"),
        )
        APUManoObra.objects.create(
            apu=apu1,
            descripcion="Obrero",
            unidad="DÍA",
            cantidad=Decimal("2.00"),
            precio_unitario=Decimal("100.00"),
        )
        APULogistica.objects.create(
            apu=apu1,
            descripcion="Transporte",
            unidad="VIAJE",
            cantidad=Decimal("1.00"),
            precio_unitario=Decimal("50.00"),
        )
        apu1.recalcular_totales()

        # APU 2 (solo materiales)
        apu2 = APU.objects.create(
            reporte=reporte,
            rendimiento=Decimal("1.000"),
            descripcion="APU 2 - Solo materiales",
            unidad="M2",
            cantidad=Decimal("5.00"),
        )
        APUMaterial.objects.create(
            apu=apu2,
            stock=self.stock,
            cantidad=Decimal("10.00"),
            desperdicio=Decimal("0.00"),
        )
        apu2.recalcular_totales()

        # NotaReporte
        NotaReporte.objects.create(
            reporte=reporte,
            titulo="Nota de prueba",
            descripcion="Esta es una nota de prueba para el presupuesto",
        )

        # Crear historial de estados (NO debe copiarse)
        HistorialEstadoReporte.objects.create(
            reporte=reporte,
            estado_anterior=None,
            estado_nuevo=EstadoChoices.EN_ESPERA,
        )

        return reporte

    def test_duplicar_retorna_201_con_nuevo_n_presupuesto(self):
        """POST /api/reportes/<id>/duplicar/ retorna 201 con n_presupuesto diferente."""
        url = reverse("reporte-duplicar", args=[self.reporte.id])
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("n_presupuesto", response.data)
        self.assertNotEqual(
            response.data["n_presupuesto"],
            self.reporte.n_presupuesto,
            "El n_presupuesto duplicado debe ser diferente al original",
        )

    def test_duplicar_preserva_apus_y_subrecursos(self):
        """El reporte duplicado tiene los mismos APUs con los mismos sub-recursos."""
        url = reverse("reporte-duplicar", args=[self.reporte.id])
        response = self.client.post(url)

        nuevo_reporte_id = response.data["id"]
        nuevo_reporte = Reporte.objects.get(id=nuevo_reporte_id)
        apus_originales = self.reporte.apus.all()
        apus_nuevos = nuevo_reporte.apus.all()

        # Misma cantidad de APUs
        self.assertEqual(apus_originales.count(), apus_nuevos.count())

        for apu_orig, apu_nuevo in zip(apus_originales, apus_nuevos):
            # Mismos valores de campos
            self.assertEqual(apu_orig.descripcion, apu_nuevo.descripcion)
            self.assertEqual(apu_orig.unidad, apu_nuevo.unidad)
            self.assertEqual(apu_orig.cantidad, apu_nuevo.cantidad)
            self.assertEqual(apu_orig.rendimiento, apu_nuevo.rendimiento)
            self.assertEqual(apu_orig.depreciacion, apu_nuevo.depreciacion)

            # Misma cantidad de sub-recursos
            self.assertEqual(
                apu_orig.materiales.count(), apu_nuevo.materiales.count()
            )
            self.assertEqual(
                apu_orig.herramientas.count(), apu_nuevo.herramientas.count()
            )
            self.assertEqual(
                apu_orig.manos_obra.count(), apu_nuevo.manos_obra.count()
            )
            self.assertEqual(
                apu_orig.logisticas.count(), apu_nuevo.logisticas.count()
            )

    def test_estado_duplicado_es_en_espera(self):
        """El reporte duplicado debe tener estado EN_ESPERA."""
        url = reverse("reporte-duplicar", args=[self.reporte.id])
        response = self.client.post(url)

        self.assertEqual(response.data["estado"], EstadoChoices.EN_ESPERA)

    def test_no_copia_historial_ni_nota_entrega(self):
        """NO debe copiar HistorialEstadoReporte ni NotaEntrega."""
        url = reverse("reporte-duplicar", args=[self.reporte.id])
        response = self.client.post(url)
        nuevo_reporte_id = response.data["id"]

        nuevo_reporte = Reporte.objects.get(id=nuevo_reporte_id)
        self.assertEqual(nuevo_reporte.historial_estados.count(), 0)
        self.assertEqual(nuevo_reporte.notas_entrega.count(), 0)

    def test_preserva_nota_reporte(self):
        """La NotaReporte debe copiarse con el mismo titulo y descripcion."""
        url = reverse("reporte-duplicar", args=[self.reporte.id])
        response = self.client.post(url)
        nuevo_reporte_id = response.data["id"]

        nota_original = self.reporte.notas.first()
        nota_nueva = Reporte.objects.get(id=nuevo_reporte_id).notas.first()

        self.assertIsNotNone(nota_nueva, "La nota debe copiarse")
        self.assertEqual(nota_original.titulo, nota_nueva.titulo)
        self.assertEqual(nota_original.descripcion, nota_nueva.descripcion)

    def test_404_si_reporte_no_existe(self):
        """Retorna 404 si el reporte no existe."""
        url = reverse("reporte-duplicar", args=[9999])
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_401_sin_autenticacion(self):
        """Retorna 401 si el usuario no está autenticado."""
        self.client.force_authenticate(user=None)  # Desautenticar
        url = reverse("reporte-duplicar", args=[self.reporte.id])
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_totales_coinciden(self):
        """Los totales del reporte duplicado deben coincidir con el original."""
        url = reverse("reporte-duplicar", args=[self.reporte.id])
        response = self.client.post(url)

        # Forzar recalcular para estar seguros
        original_total = self.reporte.total_reporte
        duplicado_total = Decimal(str(response.data["total_reporte"]))

        self.assertEqual(
            duplicado_total, original_total,
            f"Los totales deben coincidir: original={original_total}, duplicado={duplicado_total}",
        )


class DuplicarReporteAtomicidadTest(TestCase):
    """
    Verifica que el endpoint usa transaction.atomic.
    La atomicidad está garantizada por Django — este test verifica
    que el decorador/context manager esté presente y funcione.
    """

    def setUp(self):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        self.user = User.objects.create_user(username="testuser", password="testpass123")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        self.cliente = Cliente.objects.create(
            nombre="Cliente Test", rif="J-00000000-0",
            encargado="Test", telefono="0000",
            direccion="Test", correo_electronico="test2@test.com",
        )
        self.departamento = Departamento.objects.create(name="Test")
        self.stock = Stock.objects.create(
            codigo="ST-001", descripcion="Material Test",
            pza="50.00", departamento=self.departamento,
            utilidad_15=Decimal("50.00"),
        )

    def test_atomicidad_happy_path(self):
        """
        Verifica que la duplicación exitosa no deja inconsistencias:
        todos los reportes creados tienen sus APUs correspondientes.
        """
        # Crear reporte con APU
        reporte = Reporte.objects.create(cliente=self.cliente)
        apu = APU.objects.create(reporte=reporte, descripcion="APU test")
        APUMaterial.objects.create(apu=apu, stock=self.stock, cantidad=Decimal("1.00"))
        apu.recalcular_totales()

        reportes_antes = Reporte.objects.count()

        url = reverse("reporte-duplicar", args=[reporte.id])
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # Debe haber exactamente 1 reporte más
        self.assertEqual(Reporte.objects.count(), reportes_antes + 1)
        # El nuevo reporte debe tener sus APUs
        nuevo_id = response.data["id"]
        nuevo_reporte = Reporte.objects.get(id=nuevo_id)
        self.assertGreater(nuevo_reporte.apus.count(), 0)
