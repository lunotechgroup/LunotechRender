from django import forms
from .models import ContactMessage

class ContactForm(forms.ModelForm):
    class Meta:
        model = ContactMessage
        fields = ['name', 'email', 'subject', 'message']
        widgets = {
            'name': forms.TextInput(attrs={
                'placeholder': 'Your Name',
                'id': 'id_name' # Ensure ID matches your JS/CSS if needed
            }),
            'email': forms.EmailInput(attrs={
                'placeholder': 'Your Email',
                'id': 'id_email'
            }),
            'subject': forms.TextInput(attrs={
                'placeholder': 'Subject',
                'id': 'id_subject'
            }),
            'message': forms.Textarea(attrs={
                'placeholder': 'Your Message',
                'id': 'id_message'
            }),
        }