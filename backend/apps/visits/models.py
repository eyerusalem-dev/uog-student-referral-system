from django.db import models
from apps.users.models import User

class ClinicalVisit(models.Model):
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='visits')
    visit_date = models.DateTimeField(auto_now_add=True)
    symptoms = models.TextField()
    diagnosis = models.TextField(blank=True, null=True)
    medication = models.TextField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return f"{self.patient.username} - {self.visit_date}"