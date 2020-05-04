from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path("create", views.create, name="create"),
    path("events/<str:monthyear>/<str:username>", views.events, name="events"),
    path("event/<int:event_id>", views.singleEvent, name="singleEvent"),
    path("users/<str:username>", views.user, name="user"),
    path("user/current", views.currentUser, name="currentUser"),
]
