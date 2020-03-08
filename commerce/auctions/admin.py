from django.contrib import admin

from .models import User, Listing, Category, Bid, Watchlist, Comment

# Register your models here.

# Classes added for easier viewing on Django admin site.
class ListingAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'user', 'active')

class BidAdmin(admin.ModelAdmin):
    list_display = ('id', 'bid_Listing', 'bid_User', 'bid_Amount')

class WatchlistAdmin(admin.ModelAdmin):
    list_display = ('id', 'watchlist_Listing', 'watchlist_User')

class CommentAdmin(admin.ModelAdmin):
    list_display = ('id', 'comment_Listing', 'comment_User')

admin.site.register(User)
admin.site.register(Listing, ListingAdmin)
admin.site.register(Category)
admin.site.register(Bid, BidAdmin)
admin.site.register(Watchlist, WatchlistAdmin)
admin.site.register(Comment, CommentAdmin)