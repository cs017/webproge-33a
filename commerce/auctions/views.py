from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse
from django import forms
from django.db import models
from decimal import Decimal
from django.contrib.auth.decorators import login_required

from .models import User, Listing, Category, Bid, Watchlist, Comment

class NewListingForm(forms.Form):
    title = forms.CharField(label="Listing Title")
    description = forms.CharField(widget=forms.Textarea, label="Listing Description")
    starting_Bid = forms.DecimalField(max_digits=11, decimal_places=2, label="Starting Bid")
    image_Url = forms.URLField(label="Image URL", required=False)
    category = forms.ModelChoiceField(queryset=Category.objects.all(), empty_label=None)

class NewBidForm(forms.Form):
    amount = forms.DecimalField(max_digits=11, decimal_places=2, label="Submit a bid")

class NewCommentForm(forms.Form):
    content = forms.CharField(label="Add a comment")

class AddWatchForm(forms.Form):
    status = forms.HiddenInput()

class RemoveWatchForm(forms.Form):
    status = forms.HiddenInput()

class CloseAuctionForm(forms.Form):
    status = forms.HiddenInput()

def index(request):
    return render(request, "auctions/index.html", {
        "listings": Listing.objects.filter(active=True)
    })

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
            return render(request, "auctions/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "auctions/login.html")

def listings(request, id):
    listing = Listing.objects.get(pk=id)
    user = request.user
    if user.is_authenticated:
        watchlistitem = user.userwatchlist.filter(watchlist_Listing=listing)
    else:
        watchlistitem = ""

    startingbid = listing.starting_Bid
    if listing.listingbids.last():
        mostrecentbid = listing.listingbids.last()
        mostrecentbidamt = mostrecentbid.bid_Amount
        winner = mostrecentbid.bid_User
    else:
        mostrecentbidamt = startingbid
        winner = listing.user

    if request.method == "POST":
        watchform = AddWatchForm(request.POST, prefix='watch')
        bidform = NewBidForm(request.POST, prefix='bid')
        activeform = CloseAuctionForm(request.POST, prefix='active')
        commentform = NewCommentForm(request.POST, prefix='comment')
        if 'submit_bid' in request.POST:
            if bidform.is_valid():
                bidamount = bidform.cleaned_data["amount"]
                # Error messages for unacceptable bids
                if bidamount <= startingbid:
                    return render(request, "auctions/listing.html", {
                        "listing": listing,
                        "bidform": bidform,
                        "watchform": watchform,
                        "activeform": activeform,
                        "commentform": commentform,
                        "watchlistitem": watchlistitem,
                        "currentuser": user,
                        "message": "Bid not allowed. Your bid must be greater than the starting bid."
                    })
                elif bidamount <= mostrecentbidamt:
                    return render(request, "auctions/listing.html", {
                        "listing": listing,
                        "bidform": bidform,
                        "watchform": watchform,
                        "activeform": activeform,
                        "commentform": commentform,
                        "watchlistitem": watchlistitem,
                        "currentuser": user,
                        "message": "Bid not allowed. Your bid must be greater than the most recent bid."
                    })
                else:
                    # If acceptable amount, save as a new bid
                    b = Bid(bid_Amount=bidamount, bid_Listing=listing, bid_User=user)
                    b.save()
            else:
                return render(request, "auctions/listing.html", {
                    "listing": listing,
                    "bidform": bidform,
                    "watchform": watchform,
                    "activeform": activeform,
                    "commentform": commentform,
                    "watchlistitem": watchlistitem,
                    "currentuser": user
                })
        # Add listing to watchlist
        elif 'submit_add' in request.POST:
            if watchform.is_valid():
                w = Watchlist(watchlist_Listing=listing, watchlist_User=user)
                w.save()
            else:
                return render(request, "auctions/listing.html", {
                    "listing": listing,
                    "bidform": bidform,
                    "watchform": watchform,
                    "activeform": activeform,
                    "commentform": commentform,
                    "watchlistitem": watchlistitem,
                    "currentuser": user
                })
        # Remove listing from watchlist
        elif 'submit_remove' in request.POST:
            if watchform.is_valid():
                # Find appropriate watchlist item in database and delete
                user.userwatchlist.filter(watchlist_Listing=listing).delete()
            else:
                return render(request, "auctions/listing.html", {
                    "listing": listing,
                    "bidform": bidform,
                    "watchform": watchform,
                    "activeform": activeform,
                    "commentform": commentform,
                    "watchlistitem": watchlistitem,
                    "currentuser": user
                })
        elif 'submit_close' in request.POST:
            # Find appropriate listing in database and change status to "inactive"
            if activeform.is_valid():
                listing.active = False
                listing.save()
            else:
                return render(request, "auctions/listing.html", {
                    "listing": listing,
                    "bidform": bidform,
                    "watchform": watchform,
                    "activeform": activeform,
                    "commentform": commentform,
                    "watchlistitem": watchlistitem,
                    "currentuser": user
                })
        elif 'submit_comment' in request.POST:
            if commentform.is_valid():
                # Save as a new comment
                content = commentform.cleaned_data["content"]
                c = Comment(comment_Content=content, comment_Listing=listing, comment_User=user)
                c.save()
            else:
                return render(request, "auctions/listing.html", {
                    "listing": listing,
                    "bidform": bidform,
                    "watchform": watchform,
                    "activeform": activeform,
                    "commentform": commentform,
                    "watchlistitem": watchlistitem,
                    "currentuser": user
                })

    return render(request, "auctions/listing.html", {
        "listing": listing,
        "bidform": NewBidForm(prefix='bid'),
        "watchform": AddWatchForm(prefix='watch'),
        "activeform": CloseAuctionForm(prefix='active'),
        "commentform": NewCommentForm(prefix='comment'),
        "watchlistitem": watchlistitem,
        "currentuser": user,
        "winner": winner
    })

def categories(request):
    return render(request, "auctions/categories.html", {
        "categories": Category.objects.all()
    })

def category(request, id):
    cat = Category.objects.get(pk=id)

    return render(request, "auctions/category.html", {
        "category": cat,
    })

@login_required(login_url='/login')
def watchlist(request):
    user = request.user
    return render(request, "auctions/watchlist.html", {
        "watchlist": Watchlist.objects.filter(watchlist_User=user)
    })

@login_required(login_url='/login')
def create(request):
    if request.method == "POST":
        form = NewListingForm(request.POST)
        user = request.user
        if form.is_valid():
            title = form.cleaned_data["title"]
            description = form.cleaned_data["description"]
            startingbid = form.cleaned_data["starting_Bid"]
            imageurl = form.cleaned_data["image_Url"]
            listingcategory = form.cleaned_data["category"]
            listinguser = user
            # Save as a new listing
            l = Listing(title=title, description=description, starting_Bid=startingbid, image_Url=imageurl, category=listingcategory, user=listinguser)
            l.save()
        else:
            return render(request, "auctions/create.html", {
                "form": form
            })

    return render(request, "auctions/create.html", {
        "form": NewListingForm()
    })

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
            return render(request, "auctions/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "auctions/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "auctions/register.html")
