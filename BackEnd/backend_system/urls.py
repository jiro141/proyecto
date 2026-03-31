from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Módulos de la API
    path('api/inventario/', include('inventario.urls')),
    path('api/usuarios/', include('usuarios.urls')),
    path('api/reportes/', include('reportes.urls')),
    path('api/cuentas/', include('cuentas.urls')),
    
    # Autenticación JWT
    path('api/auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]