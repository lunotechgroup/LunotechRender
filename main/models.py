from django.db import models
from django.utils.text import slugify
from django.urls import reverse

class Category(models.Model):
    name_fa = models.CharField(max_length=100)
    name_en = models.CharField(max_length=100)
    slug = models.SlugField(max_length=120, unique=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name_en)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name_en

    class Meta:
        verbose_name = "Category"
        verbose_name_plural = "Categories"


class Blog(models.Model):
    # Core Content
    title_fa = models.CharField(max_length=200)
    title_en = models.CharField(max_length=200)
    subtitle_fa = models.CharField(max_length=300)
    subtitle_en = models.CharField(max_length=300)
    description_fa = models.TextField()
    description_en = models.TextField()
    slug = models.SlugField(max_length=220, unique=True, help_text="A unique URL-friendly path for the blog post.")

    # Metadata
    date = models.DateTimeField(auto_now_add=True)
    image = models.ImageField(upload_to='blog_images/')
    is_selected = models.BooleanField(default=False, help_text="Check this to include the blog in the 'selected' list.")
    
    # Relationships
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='blogs')
    
    # Creator Info
    creator_name = models.CharField(max_length=100)
    creator_title = models.CharField(max_length=100)

    def __str__(self):
        return self.title_en
    
    def get_absolute_url(self):
        return reverse("blog_detail" , kwargs={"slug": self.slug})
    

    class Meta:
        ordering = ['-date'] # Show newest blogs first


class ContactMessage(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField()
    subject = models.CharField(max_length=200)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Message from {self.name} on {self.created_at.strftime('%Y-%m-%d')}"