from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    def serialize(self):
        return {
            "id": self.id,
            "username": self.username,
        }


class Event(models.Model):
    host = models.ForeignKey("User", on_delete=models.CASCADE, related_name="events_hosting")
    invitees = models.ManyToManyField("User", related_name="events_attending", blank=True)
    start_day = models.DateField()
    start_time = models.TimeField()
    end_day = models.DateField()
    end_time = models.TimeField()
    title = models.TextField(blank=True, default="")
    description = models.TextField(blank=True, default="")

    def serialize(self):
        return {
            "id": self.id,
            "host": self.host.username,
            "invitees": [user.username for user in self.invitees.all()],
            "start_day": self.start_day,
            "start_time": self.start_time.strftime("%H:%M"),
            "end_day": self.end_day,
            "end_time": self.end_time.strftime("%H:%M"),
            "title": self.title,
            "description": self.description,
        }