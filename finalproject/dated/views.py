import json
from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse
from django import forms
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from datetime import datetime
from django.forms import MultiWidget
from django.db.models import Q

from django.contrib import messages

from .models import User, Event

def index(request):
    return render(request, "dated/index.html")

def create(request):
    # Creating a new event must be via POST    
    if request.method != "POST":
        return JsonResponse({"error": "POST request required."}, status=400)
    
    # Check invitee usernames
    data = json.loads(request.body)
    usernames = [username.strip() for username in data.get("invitees").split(",")]
    if not usernames:
        return JsonResponse({
            "error": "At least one invitee required."
        }, status=400)

    # Convert email addresses to users
    invitees = []
    for username in usernames:
        try:
            user = User.objects.get(username=username)
            invitees.append(user)
        except User.DoesNotExist:
            return JsonResponse({
                "error": f"User with username {username} does not exist."
            }, status=400)

    # Get contents of event
    start_day = data.get("start_day", "")
    start_time = data.get("start_time", "")
    end_day = data.get("end_day", "")
    end_time = data.get("end_time", "")
    title = data.get("title", "")
    description = data.get("description", "")

    event = Event(
        host=request.user,
        start_day=start_day,
        start_time=start_time,
        end_day=end_day,
        end_time=end_time,
        title=title,
        description=description
    )
    event.save()
    for invitee in invitees:
        event.invitees.add(invitee)
    event.save()

    return JsonResponse({"message": "Event created successfully."}, status=201)

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
            return render(request, "dated/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "dated/login.html")


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
            return render(request, "dated/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "dated/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "dated/register.html")

def events(request, monthyear, username):
    user = User.objects.get(username=username)
    
    this_month_items = Event.objects.filter(Q(start_day__startswith=monthyear) | Q(end_day__startswith=monthyear))
    host_items = this_month_items.filter(host=user)
    invitee_items = this_month_items.filter(invitees=user)
    event_items = host_items | invitee_items
    event_items = event_items.distinct()

    event_items = event_items.order_by("-start_time").all()
    event_items = event_items.reverse()

    if request.method == "GET":
        return JsonResponse([event_item.serialize() for event_item in event_items], safe=False)

@login_required
def user(request, username):
    profileuser = User.objects.get(username=username)   
    return JsonResponse(profileuser.serialize())

@login_required
def currentUser(request):
    if request.method == "GET":
        currentuser = request.user
        return JsonResponse(currentuser.serialize())
    else:
        return JsonResponse({"message": "Not 'GET' request."})

@login_required
def singleEvent(request, event_id):
    thisevent = Event.objects.get(pk=event_id)

    # Return event contents
    if request.method == "GET":
        return JsonResponse(thisevent.serialize())
    
    # Load info if PUT request
    elif request.method == "PUT":
        currentuser = request.user
        data = json.loads(request.body)

        # Check invitee usernames
        usernames = [username.strip() for username in data.get("invitees").split(",")]
        if not usernames:
            return JsonResponse({
                "error": "At least one invitee required."
            }, status=400)

        # Convert email addresses to users
        invitees = []
        for username in usernames:
            try:
                user = User.objects.get(username=username)
                invitees.append(user)
            except User.DoesNotExist:
                return JsonResponse({
                    "error": f"User with username {username} does not exist."
                }, status=400)

        # Get contents of event
        start_day = data.get("start_day", "")
        start_time = data.get("start_time", "")
        end_day = data.get("end_day", "")
        end_time = data.get("end_time", "")
        title = data.get("title", "")
        description = data.get("description", "")
        
        thisevent.start_day = start_day
        thisevent.start_time = start_time
        thisevent.end_day = end_day
        thisevent.end_time = end_time
        thisevent.title = title
        thisevent.description = description

        thisevent.save()

        for invitee in invitees:
            thisevent.invitees.add(invitee)
        thisevent.save()

        return JsonResponse({"message": "Event edited successfully."}, status=201)           