from django.db import models

class HospitalDepartment(models.Model):
    name = models.CharField(max_length=100, unique=True)
    building_location = models.CharField(max_length=150, blank=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name