from django.shortcuts import render

from rest_framework import viewsets
from .models import Abono
from .serializers import AbonoSerializer

class AbonoViewSet(viewsets.ModelViewSet):
    queryset = Abono.objects.all()
    serializer_class = AbonoSerializer