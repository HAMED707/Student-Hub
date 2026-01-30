from django.urls import include, path

urlpatterns = [
    path('accounts/', include('api.accounts_api.urls')),
]
