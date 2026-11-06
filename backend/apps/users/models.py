import re
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.db import models


ETHIOPIAN_PHONE_REGEX = re.compile(r'^(\+2519\d{8}|2519\d{8}|09\d{8})$')


def validate_ethiopian_phone(value):
    if value in [None, '']:
        return

    if not ETHIOPIAN_PHONE_REGEX.match(value):
        raise ValidationError(
            "Phone must be in Ethiopian format: +2519XXXXXXXX, 2519XXXXXXXX, or 09XXXXXXXX"
        )


class User(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'Administrator'),
        ('clinician', 'Clinic Clinician'),
        ('intake_team', 'Intake Team'),
        ('lab_technician', 'Lab Technician'),
        ('pharmacist', 'Pharmacist'),
    ]

    role = models.CharField(
        max_length=30,
        choices=ROLE_CHOICES,
        default='clinician'
    )

    phone = models.CharField(
        max_length=20,
        unique=True,
        null=True,
        blank=True,
        validators=[validate_ethiopian_phone]
    )

    department = models.ForeignKey(
        'departments.HospitalDepartment',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text='Only for intake_team role'
    )

    def clean(self):
        super().clean()

        validate_ethiopian_phone(self.phone)

        if self.role == 'intake_team' and self.department is None:
            raise ValidationError({
                'department': 'Intake Team users must have a department.'
            })

        if self.role != 'intake_team':
            self.department = None

    def save(self, *args, **kwargs):
         self.phone = (self.phone or "").strip() or None

         self.full_clean()
         super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"