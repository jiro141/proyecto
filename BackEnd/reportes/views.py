from rest_framework import generics, filters, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db import transaction

from .models import (
    Cliente,
    Reporte,
    ReporteConfig,
    APU,
    APUMaterial,
    APUHerramienta,
    APUManoObra,
    APULogistica,
    NotaReporte,
    EstadoChoices,
    EstadoNotaEntrega,
    NotaEntrega,
    NotaEntregaItem,
)
from .serializers import (
    ClienteSerializer,
    ReporteSerializer,
    ReporteListaSerializer,
    ReporteConfigSerializer,
    APUSerializer,
    APUMaterialSerializer,
    APUHerramientaSerializer,
    APUManoObraSerializer,
    APULogisticaSerializer,
    NotaReporteSerializer,
    NotaEntregaSerializer,
    NotaEntregaItemSerializer,
)


# ============================================================
# 🧾 CLIENTE
# ============================================================


class ClienteListCreateView(generics.ListCreateAPIView):
    queryset = Cliente.objects.all().order_by("nombre")
    serializer_class = ClienteSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["nombre", "encargado", "rif"]


class ClienteDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer


# ============================================================
# 📊 REPORTE
# ============================================================


class ReporteListCreateView(generics.ListCreateAPIView):
    """
    Lista y crea reportes.
    n_presupuesto y fecha_creacion se manejan automáticamente en el modelo.
    """

    queryset = Reporte.objects.select_related("cliente").all()
    serializer_class = ReporteSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = [
        "n_presupuesto",
        "cliente__nombre",
        "cliente__rif",
        "descripcion",
    ]

    def get_queryset(self):
        queryset = super().get_queryset()
        cliente_id = self.request.query_params.get("cliente") or self.request.query_params.get("cliente_id")
        if cliente_id:
            queryset = queryset.filter(cliente_id=cliente_id)
        return queryset


class ReporteDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Reporte.objects.select_related("cliente").prefetch_related("apus")
    serializer_class = ReporteSerializer


# ============================================================
# ⚙️ CONFIGURACIÓN DE REPORTES
# ============================================================


class ReporteConfigView(APIView):
    """
    GET: obtiene la configuración y el siguiente número de presupuesto
    POST: crea/actualiza el primer registro
    """

    def get(self, request, *args, **kwargs):
        config = ReporteConfig.objects.first()
        if not config:
            return Response(
                {"detail": "No existe configuración de reportes."},
                status=status.HTTP_404_NOT_FOUND,
            )
        
        # Calcular el siguiente número de presupuesto
        punto_inicio = config.punto_inicio or 1
        ultimo_reporte = Reporte.objects.order_by("-id").first()
        
        if ultimo_reporte:
            try:
                siguiente_numero = int(ultimo_reporte.n_presupuesto) + 1
            except (ValueError, TypeError):
                siguiente_numero = punto_inicio
        else:
            siguiente_numero = punto_inicio
        
        serializer = ReporteConfigSerializer(config)
        data = serializer.data
        data["siguiente_n_presupuesto"] = str(siguiente_numero)
        
        return Response(data, status=status.HTTP_200_OK)

    def post(self, request, *args, **kwargs):
        config = ReporteConfig.objects.first()
        if config:
            serializer = ReporteConfigSerializer(
                config, data=request.data, partial=True
            )
        else:
            serializer = ReporteConfigSerializer(data=request.data)

        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)


# ============================================================
# 📋 DUPLICAR PRESUPUESTO
# ============================================================


class DuplicarReporteView(APIView):
    """
    POST /api/reportes/<pk>/duplicar/
    Duplica un presupuesto existente con todo su arbol de APUs,
    materiales, herramientas, mano de obra, logistica y nota.
    El nuevo presupuesto obtiene un n_presupuesto auto-generado
    y se crea en estado EN_ESPERA.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        reporte_original = get_object_or_404(
            Reporte.objects.prefetch_related(
                "apus__materiales", "apus__herramientas",
                "apus__manos_obra", "apus__logisticas", "notas"
            ),
            pk=pk
        )

        with transaction.atomic():
            # 1. Crear nuevo reporte (n_presupuesto se auto-genera en save)
            nuevo_reporte = Reporte.objects.create(
                cliente=reporte_original.cliente,
                orden_servicio=reporte_original.orden_servicio,
                descripcion=reporte_original.descripcion,
                fecha_estimacion_culminacion=reporte_original.fecha_estimacion_culminacion,
                validez_oferta=reporte_original.validez_oferta,
                forma_pago=reporte_original.forma_pago,
                terminos_condiciones=reporte_original.terminos_condiciones,
            )

            # 2. Copiar APUs con todos sus sub-recursos
            for apu in reporte_original.apus.all():
                nuevo_apu = APU.objects.create(
                    reporte=nuevo_reporte,
                    rendimiento=apu.rendimiento,
                    descripcion=apu.descripcion,
                    unidad=apu.unidad,
                    cantidad=apu.cantidad,
                    depreciacion=apu.depreciacion,
                    presupuesto_base=apu.presupuesto_base,
                    presupuesto_con_desp=apu.presupuesto_con_desp,
                )

                # Copiar materiales
                if apu.materiales.exists():
                    APUMaterial.objects.bulk_create([
                        APUMaterial(
                            apu=nuevo_apu,
                            stock_id=m.stock_id,
                            consumible_id=m.consumible_id,
                            descripcion=m.descripcion,
                            unidad=m.unidad,
                            cantidad=m.cantidad,
                            desperdicio=m.desperdicio,
                            precio_unitario=m.precio_unitario,
                            total_material=m.total_material,
                        )
                        for m in apu.materiales.all()
                    ])

                # Copiar herramientas
                if apu.herramientas.exists():
                    APUHerramienta.objects.bulk_create([
                        APUHerramienta(
                            apu=nuevo_apu,
                            descripcion=h.descripcion,
                            unidad=h.unidad,
                            cantidad=h.cantidad,
                            depreciacion_hora=h.depreciacion_hora,
                            precio_unitario=h.precio_unitario,
                            total_herramienta=h.total_herramienta,
                        )
                        for h in apu.herramientas.all()
                    ])

                # Copiar mano de obra
                if apu.manos_obra.exists():
                    APUManoObra.objects.bulk_create([
                        APUManoObra(
                            apu=nuevo_apu,
                            descripcion=mo.descripcion,
                            unidad=mo.unidad,
                            cantidad=mo.cantidad,
                            precio_unitario=mo.precio_unitario,
                            total_mano_obra=mo.total_mano_obra,
                        )
                        for mo in apu.manos_obra.all()
                    ])

                # Copiar logistica
                if apu.logisticas.exists():
                    APULogistica.objects.bulk_create([
                        APULogistica(
                            apu=nuevo_apu,
                            descripcion=l.descripcion,
                            unidad=l.unidad,
                            cantidad=l.cantidad,
                            precio_unitario=l.precio_unitario,
                            total_logistica=l.total_logistica,
                        )
                        for l in apu.logisticas.all()
                    ])

                # Recalcular totales del APU (actualiza campos calculados)
                nuevo_apu.recalcular_totales()

            # 3. Copiar NotaReporte si existe
            nota_original = reporte_original.notas.first()
            if nota_original:
                NotaReporte.objects.create(
                    reporte=nuevo_reporte,
                    titulo=nota_original.titulo,
                    descripcion=nota_original.descripcion,
                )

        serializer = ReporteSerializer(nuevo_reporte, context={"request": request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


# ============================================================
# 🧮 APU
# ============================================================


class APUListCreateView(generics.ListCreateAPIView):
    """
    Lista y crea APUs asociados a un reporte.
    """

    serializer_class = APUSerializer
    pagination_class = None  # Siempre traer TODOS los APUs (edición necesita la lista completa)

    def get_queryset(self):
        reporte_id = self.kwargs.get("reporte_id")
        return APU.objects.filter(reporte_id=reporte_id).prefetch_related(
            "materiales", "herramientas", "manos_obra", "logisticas"
        )

    def perform_create(self, serializer):
        reporte_id = self.kwargs.get("reporte_id")
        reporte = get_object_or_404(Reporte, id=reporte_id)
        apu = serializer.save(reporte=reporte)
        # Si ya quieres dejarlo “limpio”:
        apu.recalcular_totales()


class APUDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = APU.objects.prefetch_related(
        "materiales", "herramientas", "manos_obra", "logisticas"
    )
    serializer_class = APUSerializer

    def perform_update(self, serializer):
        apu = serializer.save()
        apu.recalcular_totales()


# ============================================================
# 🧱 MATERIALES
# ============================================================


class APUMaterialListCreateView(generics.ListCreateAPIView):
    serializer_class = APUMaterialSerializer

    def get_queryset(self):
        apu_id = self.kwargs.get("apu_id")
        return APUMaterial.objects.filter(apu_id=apu_id)

    def perform_create(self, serializer):
        apu_id = self.kwargs.get("apu_id")
        apu = get_object_or_404(APU, id=apu_id)
        material = serializer.save(apu=apu)
        material.apu.recalcular_totales()


class APUMaterialDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = APUMaterial.objects.all()
    serializer_class = APUMaterialSerializer

    def perform_update(self, serializer):
        material = serializer.save()
        material.apu.recalcular_totales()

    def perform_destroy(self, instance):
        apu = instance.apu
        super().perform_destroy(instance)
        apu.recalcular_totales()


# ============================================================
# 🛠️ HERRAMIENTAS
# ============================================================


class APUHerramientaListCreateView(generics.ListCreateAPIView):
    serializer_class = APUHerramientaSerializer

    def get_queryset(self):
        apu_id = self.kwargs.get("apu_id")
        return APUHerramienta.objects.filter(apu_id=apu_id)

    def perform_create(self, serializer):
        apu_id = self.kwargs.get("apu_id")
        apu = get_object_or_404(APU, id=apu_id)
        herramienta = serializer.save(apu=apu)
        herramienta.apu.recalcular_totales()


class APUHerramientaDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = APUHerramienta.objects.all()
    serializer_class = APUHerramientaSerializer

    def perform_update(self, serializer):
        h = serializer.save()
        h.apu.recalcular_totales()

    def perform_destroy(self, instance):
        apu = instance.apu
        super().perform_destroy(instance)
        apu.recalcular_totales()


# ============================================================
# 👷 MANO DE OBRA
# ============================================================


class APUManoObraListCreateView(generics.ListCreateAPIView):
    serializer_class = APUManoObraSerializer

    def get_queryset(self):
        apu_id = self.kwargs.get("apu_id")
        return APUManoObra.objects.filter(apu_id=apu_id)

    def perform_create(self, serializer):
        apu_id = self.kwargs.get("apu_id")
        apu = get_object_or_404(APU, id=apu_id)
        mo = serializer.save(apu=apu)
        mo.apu.recalcular_totales()


class APUManoObraDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = APUManoObra.objects.all()
    serializer_class = APUManoObraSerializer

    def perform_update(self, serializer):
        mo = serializer.save()
        mo.apu.recalcular_totales()

    def perform_destroy(self, instance):
        apu = instance.apu
        super().perform_destroy(instance)
        apu.recalcular_totales()


# ============================================================
# 🚚 LOGÍSTICA
# ============================================================


class APULogisticaListCreateView(generics.ListCreateAPIView):
    serializer_class = APULogisticaSerializer

    def get_queryset(self):
        apu_id = self.kwargs.get("apu_id")
        return APULogistica.objects.filter(apu_id=apu_id)

    def perform_create(self, serializer):
        apu_id = self.kwargs.get("apu_id")
        apu = get_object_or_404(APU, id=apu_id)
        l = serializer.save(apu=apu)
        l.apu.recalcular_totales()


class APULogisticaDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = APULogistica.objects.all()
    serializer_class = APULogisticaSerializer

    def perform_update(self, serializer):
        l = serializer.save()
        l.apu.recalcular_totales()

    def perform_destroy(self, instance):
        apu = instance.apu
        super().perform_destroy(instance)
        apu.recalcular_totales()


class NotaReporteListCreateView(generics.ListCreateAPIView):
    """
    Lista y crea notas para un reporte.
    Si viene reporte_id en la URL, filtra por ese reporte
    y al crear asigna ese reporte automáticamente.
    """
    serializer_class = NotaReporteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        reporte_id = self.kwargs.get("reporte_id")
        qs = NotaReporte.objects.all()
        if reporte_id is not None:
            qs = qs.filter(reporte_id=reporte_id)
        return qs.order_by("-creado_en")

    def perform_create(self, serializer):
        reporte_id = self.kwargs.get("reporte_id")
        if reporte_id is not None:
            serializer.save(reporte_id=reporte_id)
        else:
            serializer.save()


class NotaReporteDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Ver / actualizar / eliminar una nota de un reporte específico.
    Si no existe una nota para ese reporte, la crea automáticamente.
    """
    serializer_class = NotaReporteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        reporte_id = self.kwargs.get("pk")
        
        # Buscar nota existente para ese reporte
        nota, created = NotaReporte.objects.get_or_create(
            reporte_id=reporte_id,
            defaults={
                "titulo": "",
                "descripcion": "",
            },
        )
        
        # Si se acaba de crear, guardar para que tenga ID
        if created:
            nota.save()
        
        return nota


# ============================================================
# 💰 CUENTAS POR COBRAR
# ============================================================


class CuentasPorCobrarView(generics.ListAPIView):
    """
    Lista todos los reportes con estado EJECUTADO y saldo pendiente > 0.
    """
    serializer_class = ReporteListaSerializer

    def get_queryset(self):
        from django.db.models import Sum, F, Value, OuterRef
        from django.db.models.functions import Coalesce
        from django.db import models
        from cuentas.models import Abono
        
        # Subquery para calcular el total abonado (especificar output_field como Decimal)
        abonos_subquery = Abono.objects.filter(
            reporte_id=OuterRef('id')
        ).values('reporte_id').annotate(
            total=Sum('monto', output_field=models.DecimalField(max_digits=14, decimal_places=2))
        ).values('total')

        return Reporte.objects.select_related("cliente").filter(
            estado=EstadoChoices.EJECUTADO
        ).annotate(
            total_abonado=Coalesce(abonos_subquery, Value(0, output_field=models.DecimalField(max_digits=14, decimal_places=2)))
        ).order_by("-fecha_creacion")


class ReporteAbonosView(APIView):
    """
    Lista los abonos de un reporte específico (solo si el reporte está en estado ejecutado).
    """
    def get(self, request, reporte_id):
        from cuentas.models import Abono
        from cuentas.serializers import AbonoSerializer
        
        # Verificar que el reporte esté en estado ejecutado
        reporte = get_object_or_404(
            Reporte.objects.filter(
                estado=EstadoChoices.EJECUTADO
            ),
            pk=reporte_id
        )
        
        abonos = Abono.objects.filter(reporte_id=reporte_id).order_by("-fecha_abono")
        serializer = AbonoSerializer(abonos, many=True)
        return Response(serializer.data)


# ============================================================
# 📦 NOTAS DE ENTREGA
# ============================================================


class NotaEntregaListCreateView(generics.ListCreateAPIView):
    """
    Lista y crea notas de entrega.
    Si viene reporte_id en la URL, filtra por ese reporte.
    """

    serializer_class = NotaEntregaSerializer

    def get_queryset(self):
        reporte_id = self.kwargs.get("reporte_id")
        qs = NotaEntrega.objects.all()
        if reporte_id is not None:
            qs = qs.filter(reporte_id=reporte_id)
        return qs.prefetch_related("items").order_by("-created_at")

    def create(self, request, *args, **kwargs):
        # Extraer los items del request
        items_data = request.data.pop("items", [])
        reporte_id = request.data.get("reporte")

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Guardar items_data en el contexto para el serializer
        serializer.context["items_data"] = items_data

        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def perform_create(self, serializer):
        serializer.save()


class NotaEntregaDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Ver / actualizar / eliminar una nota de entrega específica.
    Solo se puede editar si está en estado BORRADOR.
    """

    queryset = NotaEntrega.objects.prefetch_related("items")
    serializer_class = NotaEntregaSerializer

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()

        # Solo permitir edición si está en borrador
        if instance.estado != EstadoNotaEntrega.BORRADOR:
            return Response(
                {"detail": "Solo se puede editar notas en estado Borrador"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Extraer los items del request
        items_data = request.data.pop("items", [])

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        # Si hay items nuevos, actualizar
        if items_data and instance.estado == EstadoNotaEntrega.BORRADOR:
            # Eliminar items existentes y crear nuevos
            instance.items.all().delete()
            for item_data in items_data:
                NotaEntregaItem.objects.create(
                    nota_entrega=instance,
                    apu_descripcion=item_data.get("apu_descripcion", ""),
                    cantidad_total=item_data.get("cantidad_total", 0),
                    cantidad_entregada=item_data.get("cantidad_entregada", 0),
                    precio_unitario=item_data.get("precio_unitario", 0),
                )

        self.perform_update(serializer)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        """Anular nota de entrega (cambiar estado a ANULADA)."""
        instance = self.get_object()

        if instance.estado == EstadoNotaEntrega.EMITIDA:
            instance.estado = EstadoNotaEntrega.ANULADA
            instance.save(update_fields=["estado"])
            return Response(status=status.HTTP_204_NO_CONTENT)

        # Si es borrador, eliminar
        if instance.estado == EstadoNotaEntrega.BORRADOR:
            return super().destroy(request, *args, **kwargs)

        return Response(
            {"detail": "No se puede eliminar notas emitidas"},
            status=status.HTTP_400_BAD_REQUEST
        )


class NotaEntregaPorReporteView(APIView):
    """
    Obtiene el resumen de entregas por APU de un reporte.
    Muestra cantidad_total, cantidad_entregada y pendiente por cada APU.
    Incluye el correlativo y código alfa de cada nota.
    """

    def get(self, request, reporte_id):
        from django.db.models import Sum

        reporte = get_object_or_404(Reporte, id=reporte_id)

        # Obtener notas emitidas del reporte
        notas_emitidas = NotaEntrega.objects.filter(
            reporte_id=reporte_id,
            estado=EstadoNotaEntrega.EMITIDA
        ).prefetch_related("items")

        # Obtener todos los items de notas emitidas
        items_agrupados = {}

        for nota in notas_emitidas:
            for item in nota.items.all():
                desc = item.apu_descripcion
                if desc not in items_agrupados:
                    items_agrupados[desc] = {
                        "apu_descripcion": desc,
                        "cantidad_total": float(item.cantidad_total),
                        "cantidad_entregada": 0,
                        "precio_unitario": float(item.precio_unitario),
                        "notas": [],
                    }
                items_agrupados[desc]["cantidad_entregada"] += float(item.cantidad_entregada)
                # Agregar referencia a la nota
                items_agrupados[desc]["notas"].append({
                    "n_nota": nota.n_nota,
                    "codigo_alfa": nota.codigo_alfa,
                })

        # Calcular pendiente
        resultado = []
        for desc, data in items_agrupados.items():
            resultado.append({
                "apu_descripcion": data["apu_descripcion"],
                "cantidad_total": data["cantidad_total"],
                "cantidad_entregada": data["cantidad_entregada"],
                "cantidad_pendiente": data["cantidad_total"] - data["cantidad_entregada"],
                "precio_unitario": data["precio_unitario"],
                "notas": data["notas"],
            })

        # Obtener lista de notas Emitidas para el resumen general
        notas_list = []
        for nota in notas_emitidas:
            notas_list.append({
                "n_nota": nota.n_nota,
                "codigo_alfa": nota.codigo_alfa,
                "fecha_entrega": nota.fecha_entrega.isoformat() if nota.fecha_entrega else None,
            })

        return Response({
            "reporte_id": reporte_id,
            "n_presupuesto": reporte.n_presupuesto,
            "cliente_nombre": reporte.cliente.nombre,
            "notas_emitidas": notas_list,
            "entregas": resultado
        })
