from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.utils import timezone

from .managers import UserManager


class User(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        SUPER_ADMIN = "super_admin", "Super Admin"
        EVENT_HOST = "event_host", "Event Host"
        USHER = "usher", "Usher"

    full_name = models.CharField(max_length=150)

    email = models.EmailField(
        unique=True
    )

    phone_number = models.CharField(
        max_length=20,
        unique=True
    )

    is_active = models.BooleanField(
        default=True
    )

    is_staff = models.BooleanField(
        default=False
    )

    role = models.CharField(
        max_length=30,
        choices=Role.choices,
        default=Role.EVENT_HOST,
    )

    date_joined = models.DateTimeField(
        default=timezone.now
    )

    USERNAME_FIELD = "email"

    REQUIRED_FIELDS = [
        "full_name",
        "phone_number",
    ]

    objects = UserManager()

    def __str__(self):
        return self.email
