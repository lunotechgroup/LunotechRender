# main/admin.py

from django.contrib import admin
from .models import Category, Blog, ContactMessage
from tinymce.widgets import TinyMCE # Import the widget

class BlogAdmin(admin.ModelAdmin):
    # This allows you to define a custom form for the admin
    class Media:
        js = ('/static/js/tinymce_init.js',) # We will create this file

    list_display = ('title_en', 'category', 'date', 'is_selected')
    list_filter = ('is_selected', 'category', 'date')
    search_fields = ('title_en', 'title_fa', 'description_en')
    prepopulated_fields = {'slug': ('title_en',)}
    
    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        form.base_fields['description_fa'].widget = TinyMCE(attrs={'cols': 80, 'rows': 30})
        form.base_fields['description_en'].widget = TinyMCE(attrs={'cols': 80, 'rows': 30})
        return form


admin.site.register(Blog, BlogAdmin)


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name_en', 'name_fa', 'slug')
    prepopulated_fields = {'slug': ('name_en',)}

@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'subject', 'created_at')
    readonly_fields = ('name', 'email', 'subject', 'message', 'created_at')