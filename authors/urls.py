from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AuthorViewSet,proxy_authors,authors_xml

router = DefaultRouter()
router.register(r'authors', AuthorViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path("xml/", authors_xml, name="authors-xml"),
    path('proxy-authors/', proxy_authors, name='proxy-authors'),
]
