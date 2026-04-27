from django.db import models
import uuid
from apps.students.models import Student
from apps.users.models import User
from apps.visits.models import ClinicalVisit
from apps.departments.models import HospitalDepartment

class Referral(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
    ]

    referral_id = models.CharField(max_length=30, unique=True, editable=False)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='referrals')
    clinical_visit = models.ForeignKey(
        ClinicalVisit,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='referrals'
    )
    referred_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    receiving_department = models.ForeignKey(HospitalDepartment, on_delete=models.PROTECT)

    reason = models.TextField()
    referral_note = models.TextField(blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    response_note = models.TextField(blank=True)
    responded_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.referral_id:
            self.referral_id = "REF-" + str(uuid.uuid4()).upper()[:8]
        super().save(*args, **kwargs)

    def __str__(self):
        return self.referral_id