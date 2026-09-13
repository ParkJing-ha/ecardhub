import re
from django.core.exceptions import ValidationError

class ValidateStrongPassword:
    def validate(self, password, user=None):
        if len(password) < 12:
            raise ValidationError(
                "Password must be at least 12 characters long."
            )

        if not re.search(r"[A-Z]", password):
            raise ValidationError(
                "Password must contain at least one uppercase letter."
            )

        if not re.search(r"[a-z]", password):
            raise ValidationError(
                "Password must contain at least one lowercase letter."
            )

        if not re.search(r"\d", password):
            raise ValidationError(
                "Password must contain at least one number."
            )

        if not re.search(r"[^\w\s]", password):
            raise ValidationError(
                "Password must contain at least one special character."
            )

    def get_help_text(self):
        return "Your password must contain at least 12 characters, including uppercase, lowercase, numbers, and special characters."
