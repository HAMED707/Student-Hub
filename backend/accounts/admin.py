from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Users


@admin.register(Users)
class CustomUserAdmin(UserAdmin):
    """Custom admin for Users model"""
    
    list_display = ('username', 'email', 'first_name', 'last_name', 'phone_number', 'gender', 'is_staff', 'is_active', 'date_joined')
    list_filter = ('is_staff', 'is_active', 'gender', 'date_joined')
    search_fields = ('username', 'email', 'first_name', 'last_name', 'phone_number')  # searchable fields
    ordering = ('-date_joined',)
    
    # Add custom fields to the fieldsets
    fieldsets = UserAdmin.fieldsets + (
        ('Additional Info', {
            'fields': ('phone_number', 'date_of_birth', 'gender', 'profile_picture')
        }),
    )
    
    # Add custom fields to the add form
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Additional Info', {
            'fields': ('email', 'first_name', 'last_name', 'phone_number', 'date_of_birth', 'gender', 'profile_picture')
        }),
    )
