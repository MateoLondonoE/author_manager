from django.db import models

class Author(models.Model):
    name = models.CharField(max_length=100)
    birthdate = models.DateField()
    nationality = models.CharField(max_length=50)
    biography = models.TextField()

    def __str__(self):
        return self.name
