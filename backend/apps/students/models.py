from django.db import models

class Student(models.Model):
    university_id = models.CharField(max_length=30, primary_key=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    department = models.CharField(max_length=100)
    year_of_study = models.IntegerField()
    phone = models.CharField(max_length=20)
    photo = models.ImageField(upload_to='student_photos/', blank=True, null=True)
    emergency_contact = models.CharField(max_length=20, blank=True)
    university = models.CharField(max_length=10, default="UOG")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.university_id} - {self.first_name} {self.last_name}"