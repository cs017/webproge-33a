from django.urls import path

from . import views


urlpatterns = [
    path("", views.index, name="index"),
    path("wiki/newpage", views.newpage, name="newpage"),
    path("wiki/editpage/<str:title>", views.editpage, name="editpage"),
    path("wiki/searchresults/<str:q>", views.search, name="search"),
    path("wiki/<str:title>", views.entries, name="entries"),
    path("wiki/randomentry", views.randomentry, name="randomentry")
]