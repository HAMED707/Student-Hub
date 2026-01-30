from .models import Users
from django.contrib.auth import authenticate

def create_user_account(username, email, first_name=None, last_name=None, password=None,
                        phone_number=None, gender=None, date_of_birth=None, profile_picture=None):
    user = Users.objects.create_user(
        username=username,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name,
    )

    user.phone_number = phone_number
    user.gender = gender
    user.date_of_birth = date_of_birth
    user.profile_picture = profile_picture
    user.save(update_fields=["phone_number", "gender", "date_of_birth", "profile_picture"])
    return user

def authenticated(username, password):
    # returns user obj or None
    user = authenticate(username=username, password=password)
    return user
