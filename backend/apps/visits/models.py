from django.db import models
from apps.users.models import User
from apps.students.models import Student 

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

class LabRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
    ]
    
    clinical_visit = models.ForeignKey(
        ClinicalVisit,
        on_delete=models.CASCADE,
        related_name='lab_requests'
    )
    test_name = models.CharField(max_length=200)
    reason = models.TextField(blank=True)
    requested_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.test_name} - {self.status}"


class Prescription(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('dispensed', 'Dispensed'),
    ]
    
    clinical_visit = models.ForeignKey(
        ClinicalVisit,
        on_delete=models.CASCADE,
        related_name='prescriptions'
    )
    medication_name = models.CharField(max_length=200)
    dosage = models.CharField(max_length=100)
    frequency = models.CharField(max_length=100)
    duration = models.CharField(max_length=100)
    prescribed_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    dispensed_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.medication_name} - {self.status}"