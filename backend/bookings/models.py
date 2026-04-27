"""
booking models 
    -handel all room booking BTW student and landloard

"""

from django.db import models
from accounts.models import Users
from properties.models import Property


class Booking(models.Model):


    STATUS_CHOICES=[
        ("pending" , "Pending"),
        ("approved" , "Approved"),
        ("rejected" , "Rejected"),
        ("cancelled" , "Cancelled"),
        ("completed" , "Completed"),
    ]

    # ────Parties──────────────────────────────────────────────────────────────────────────────────────────────────────────
    tenant     = models.ForeignKey(Users, on_delete=models.CASCADE, related_name="bookings" , limit_choices_to={ "role" : "student" })
    property   = models.ForeignKey(Property, on_delete=models.CASCADE, related_name="bookings")

    # ────Booking Details─────────────────────────────────────────────────────────────────────────────────────────────────
    status          = models.CharField(max_length=15 ,choices=STATUS_CHOICES ,default='pending')
    move_in_date    = models.DateField()
    duration_months = models.PositiveIntegerField()
    message         = models.TextField(null=True , blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    #TODO: custom validation to prevent the tenant booking the same property more than one time

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.tenant.username} - {self.property.title} -({self.status})"