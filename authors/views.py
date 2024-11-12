from django.shortcuts import render
from rest_framework import viewsets
from .models import Author
from .serializers import AuthorSerializer
import requests
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.core.serializers import serialize
import json
from xml.etree.ElementTree import Element, tostring

class AuthorViewSet(viewsets.ModelViewSet):
    queryset = Author.objects.all()
    serializer_class = AuthorSerializer
    
def authors_xml(request):
    api_url = "https://book-manager-api-iiyx.onrender.com/authors/"
    nationality_filter = request.GET.get('nationality')  # Obtener el filtro de nacionalidad

    try:
        response = requests.get(api_url)
        response.raise_for_status()
        authors = response.json()  # Convertir la respuesta en JSON

        # Crear el XML filtrado
        root = Element("authors")
        for author in authors:
            if nationality_filter and author["nationality"] != nationality_filter:
                continue  # Omitir autores que no coincidan con el filtro

            author_elem = Element("author")
            for key, value in author.items():
                child = Element(key)
                child.text = str(value)
                author_elem.append(child)
            root.append(author_elem)

        xml_data = tostring(root, encoding="unicode")
        return HttpResponse(xml_data, content_type="application/xml")

    except requests.RequestException as e:
        return HttpResponse(f"<error>{str(e)}</error>", content_type="application/xml", status=500)




def index(request):
    return render(request, "index.html")


import requests
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
def proxy_authors(request):
    base_url = "https://book-manager-api-iiyx.onrender.com/authors/"
    headers = {"Content-Type": "application/json"}

    try:
        if request.method == "GET":
            response = requests.get(base_url)
            return JsonResponse(response.json(), safe=False)

        elif request.method == "POST":
            data = request.body
            response = requests.post(base_url, data=data, headers=headers)
            return HttpResponse(response.content, status=response.status_code)

        elif request.method == "PUT":
            author_id = request.GET.get('id')  # Obtén el ID del autor de los parámetros
            if not author_id:
                return JsonResponse({"error": "Author ID not provided"}, status=400)

            data = request.body  # Obtén los datos actualizados
            response = requests.put(f"{base_url}{author_id}/", data=data, headers=headers)
            return HttpResponse(response.content, status=response.status_code)

        elif request.method == "DELETE":
            author_id = request.GET.get('id')
            if not author_id:
                return JsonResponse({"error": "Author ID not provided"}, status=400)

            response = requests.delete(f"{base_url}{author_id}/", headers=headers)
            return HttpResponse(response.content, status=response.status_code)

        else:
            return JsonResponse({"error": "Method not allowed"}, status=405)
    except requests.RequestException as e:
        return JsonResponse({"error": str(e)}, status=500)
