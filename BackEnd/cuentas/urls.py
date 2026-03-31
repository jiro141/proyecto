from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AbonoViewSet

router = DefaultRouter()
router.register(r'abonos', AbonoViewSet)

urlpatterns = [
    path('', include(router.urls)),
]