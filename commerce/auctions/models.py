from django.contrib.auth.models import AbstractUser
from django.db import models

##FIGURE OUT CASCADE/PROTECT

class User(AbstractUser):
    pass

## MODEL - CATEGORIES
class Category(models.Model):
    name = models.CharField(max_length=20, default="")

    class Meta:
        verbose_name_plural = "Categories"
    
    def __str__(self):
        return f"{self.name}"

## MODEL - AUCTION LISTINGS
class Listing(models.Model):
    title = models.CharField(max_length=35, default="")
    description = models.CharField(max_length=100, default="")
    starting_Bid = models.DecimalField(max_digits=11, decimal_places=2, default=1.00)
    image_Url = models.URLField(default="", blank=True)
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="catlistings",default="Miscellaneous")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="userlistings")
    active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.id}"

## MODEL - BIDS
class Bid(models.Model):
    bid_Amount = models.DecimalField(max_digits=11, decimal_places=2, default=1.00)
    bid_Listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name="listingbids")
    bid_User = models.ForeignKey(User, on_delete=models.CASCADE, related_name="userbids")

## MODEL - COMMENTS MADE ON AUCTION LISTINGS
class Comment(models.Model):
    comment_Content = models.CharField(max_length=100, default="")
    comment_User = models.ForeignKey(User, on_delete=models.CASCADE, related_name="usercomments")
    comment_Listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name="listingcomments")

## MODEL - WATCHLIST
class Watchlist(models.Model):
    watchlist_Listing = models.ForeignKey(Listing, on_delete=models.CASCADE)
    watchlist_User = models.ForeignKey(User, on_delete=models.CASCADE, related_name="userwatchlist")