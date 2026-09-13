from django.contrib.auth.models import BaseUserManager


class UserManager(BaseUserManager):

    def create_user(self, email, full_name, phone_number, password=None):

        if not email:
            raise ValueError("Email is required")

        if not full_name:
            raise ValueError("Full name is required")

        if not phone_number:
            raise ValueError("Phone number is required")

        email = self.normalize_email(email)

        user = self.model(
            email=email,
            full_name=full_name,
            phone_number=phone_number,
        )

        user.set_password(password)

        user.save(using=self._db)

        return user

    def create_superuser(
        self,
        email,
        full_name,
        phone_number,
        password=None
    ):

        user = self.create_user(
            email=email,
            full_name=full_name,
            phone_number=phone_number,
            password=password,
        )

        user.is_staff = True
        user.is_superuser = True
        user.is_active = True

        user.save(using=self._db)

        return user