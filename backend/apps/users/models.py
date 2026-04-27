from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'Administrator'),
        ('clinician', 'Clinic Clinician'),
        ('department_receiver', 'Hospital Department Receiver'),
    ]

    role = models.CharField(max_length=30, choices=ROLE_CHOICES, default='clinician')
    phone = models.CharField(max_length=15, blank=True)
    department = models.ForeignKey(
        'departments.HospitalDepartment',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="Only for department_receiver role"
    )

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"