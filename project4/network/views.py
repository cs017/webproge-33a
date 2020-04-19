import json
from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.core import serializers
from django.core.paginator import Paginator


from .models import User, Post


def index(request):
    return render(request, "network/index.html")


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")

@login_required
def compose(request):

    # Composing a new post must be via POST    
    if request.method != "POST":
        return JsonResponse({"error": "POST request required."}, status=400)

    # Get contents of post
    data = json.loads(request.body)
    body = data.get("body", "")

    # Create the post
    post = Post(
        poster=request.user,
        body=body,
    )
    post.save()

    return JsonResponse({"message": "Post created successfully."}, status=201)

# Returns whether or not a previous/next page exists for page nav displays
@login_required
def postview(request, postview, page_num):
    if request.method == "GET":
        # Filter posts returned based on postview
        if postview == "all":
            posts = Post.objects.all()

        elif User.objects.filter(username=postview).exists():
            this_user = User.objects.get(username=postview)
            posts = this_user.posts_made.all()

        elif postview == "followed":
            currentuser = request.user
            followed_users = currentuser.users_followed.all()
            posts = Post.objects.filter(pk=0)
            for followed_user in followed_users:
                user_posts = followed_user.posts_made.all()
                posts = user_posts | posts

        else:
            return JsonResponse({"error": "Invalid postview."}, status=400)

        # Return posts in reverse chronological order
        posts = posts.order_by("-timestamp").all()
        allposts = Paginator(posts, 10)
        thispage = allposts.page(page_num)
        response = {
            'previous': thispage.has_previous(),
            'next': thispage.has_next()
        }
        return JsonResponse(response)

    else:
        return JsonResponse({"message": "Request method is not GET."}, status=201)

# Returns list of posts and content for a single page, after pagination
@login_required
def viewpage(request, postview, page_num):
    if request.method == "GET":
        # Filter posts returned based on postview
        if postview == "all":
            posts = Post.objects.all()

        elif User.objects.filter(username=postview).exists():
            this_user = User.objects.get(username=postview)
            posts = this_user.posts_made.all()

        elif postview == "followed":
            currentuser = request.user
            followed_users = currentuser.users_followed.all()
            posts = Post.objects.filter(pk=0)
            for followed_user in followed_users:
                user_posts = followed_user.posts_made.all()
                posts = user_posts | posts

        else:
            return JsonResponse({"error": "Invalid postview."}, status=400)

        # Return posts in reverse chronological order
        posts = posts.order_by("-timestamp").all()
        posts = page(posts, page_num)
        return JsonResponse([post.serialize() for post in posts], safe=False)

    else:
        return JsonResponse({"message": "Request method is not GET."}, status=201)

def page(posts, page_num):
    allposts = Paginator(posts, 10)
    page_posts = allposts.page(page_num).object_list
    return page_posts

@login_required
def post(request, post_id):
    thispost = Post.objects.get(pk=post_id)

    # Return email contents
    if request.method == "GET":
        return JsonResponse(thispost.serialize())

    # Update like/unlike or edited body
    elif request.method == "PUT":
        currentuser = request.user
        data = json.loads(request.body)
        if data.get("like") is True:
            thispost = thispost.likes.add(currentuser)
            return JsonResponse({"message": "Post liked successfully."}, status=201)
        elif data.get("like") is False:
            thispost = thispost.likes.remove(currentuser)
            return JsonResponse({"message": "Post unliked successfully."}, status=201)
        elif data.get("edit") is True:
            body = data.get("body", "")
            thispost.body = body
            thispost.save()
            return JsonResponse(thispost.serialize())

@login_required
def user(request, username):

    profileuser = User.objects.get(username=username)   

    if request.method == "PUT":
        # Get current user
        currentuser = request.user
        data = json.loads(request.body)
        if data.get("follow") is True:
            profileuser = profileuser.followers.add(currentuser)
            return JsonResponse({"message": "User followed successfully."}, status=201)
        elif data.get("follow") is False:
            profileuser = profileuser.followers.remove(currentuser)
            return JsonResponse({"message": "User unfollowed successfully."}, status=201)

    else:
        return JsonResponse(profileuser.serialize())

@login_required
def currentUser(request):
    if request.method == "GET":
        currentuser = request.user
        return JsonResponse(currentuser.serialize())
    else:
        return JsonResponse({"message": "Not 'GET' request."})
    