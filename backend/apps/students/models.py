# apps/students/models.py (Expected structure)
from django.db import models

class Student(models.Model):
    university_id = models.CharField(max_length=30, primary_key=True, unique=True) # PK as per schema
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    department = models.CharField(max_length=100) # Academic dept, not HospitalDepartment
    year_of_study = models.CharField(max_length=20) # e.g., "Year 1", "Year 2"
    phone = models.CharField(max_length=20, blank=True, null=True)
    emergency_contact = models.CharField(max_length=200, blank=True, null=True)
    photo = models.ImageField(upload_to='student_photos/', blank=True, null=True)
    university = models.CharField(max_length=50, default="UOG")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.university_id})"

    