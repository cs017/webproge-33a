
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),

    # API Routes
    path("posts", views.compose, name="compose"),
    path("posts/<int:post_id>", views.post, name="post"),
    path("posts/view/<str:postview>/<int:page_num>", views.postview, name="postview"),
    path("posts/<str:postview>/<int:page_num>", views.viewpage, name="viewpage"),
    path("users/<str:username>", views.user, name="user"),
    path("user/current", views.currentUser, name="currentUser"),
]
