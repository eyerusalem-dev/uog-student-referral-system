from django.db import models
from apps.users.models import User
from apps.students.models import Student # Ensure this import is correct

class ClinicalVisit(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='visits')
    clinician = models.ForeignKey(User, on_delete=models.CASCADE, related_name='clinical_visits')
    visit_date = models.DateTimeField(auto_now_add=True)
    
    # Clinical Details
    symptoms = models.TextField()
    diagnosis = models.TextField(blank=True, null=True)
    advice = models.TextField(blank=True, null=True)
    treatment = models.TextField(blank=True, null=True)
    note = models.TextField(blank=True, null=True)
    
    # Lab and Pharmacy
    lab_used = models.BooleanField(default=False)
    lab_note = models.TextField(blank=True, null=True)
    pharmacy_used = models.BooleanField(default=False)
    medication_given = models.TextField(blank=True, null=True)
    
    # Locking mechanism
    is_locked = models.BooleanField(default=True)

    def __str__(self):
        return f"Visit - {self.student.university_id} on {self.visit_date.date()}"