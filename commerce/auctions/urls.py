from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("auctions/<int:id>", views.listings, name="listings"),
    path("categories", views.categories, name="categories"),
    path("categories/<int:id>", views.category, name="category"),
    path("watchlist", views.watchlist, name="watchlist"),
    path("create", views.create, name="create"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register")
]
