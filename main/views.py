from django.shortcuts import render, get_object_or_404, redirect
from django.db.models import Q
from .models import Blog, Category, ContactMessage
from .forms import ContactForm

def home(request):
    """
    View for the home page.
    Fetches only the 'selected' blog posts to display.
    """
    selected_blogs = Blog.objects.filter(is_selected=True).order_by('-date')
    context = {
        'posts': selected_blogs
    }
    return render(request, 'index.html', context)

def blog_list(request):
    """
    View for the blog list page.
    Handles a deep search functionality based on the 'q' GET parameter.
    """
    query = request.GET.get('q')
    blogs = Blog.objects.all().order_by('-date') # Start with all blogs

    if query:
        # Filter blogs where the query matches in any of the specified fields,
        # including related Category and creator_name.
        blogs = blogs.filter(
            Q(title_en__icontains=query) |
            Q(title_fa__icontains=query) |
            Q(subtitle_en__icontains=query) |
            Q(subtitle_fa__icontains=query) |
            Q(description_en__icontains=query) |
            Q(description_fa__icontains=query) |
            Q(category__name_en__icontains=query) | # Search in related category's English name
            Q(category__name_fa__icontains=query) | # Search in related category's Farsi name
            Q(creator_name__icontains=query)        # Search in the creator's name
        ).distinct() # Use distinct() to avoid duplicate results

    context = {
        'posts': blogs,
    }
    return render(request, 'blog_list.html', context)

def blog_detail(request, slug):
    """
    View for a single blog post detail page.
    Fetches a specific blog post by its unique slug.
    """
    post = get_object_or_404(Blog, slug=slug)
    context = {
        'post': post,
    }
    return render(request, 'blog_detail.html', context)

def contact(request):
    """
    View for the contact page.
    Handles both displaying the form (GET) and processing form submissions (POST).
    """
    if request.method == 'POST':
        form = ContactForm(request.POST)
        if form.is_valid():
            form.save()
            # Redirect to the same page to clear the form after successful submission
            return redirect('contact') 
    else:
        form = ContactForm()

    context = {
        'form': form
    }
    return render(request, 'contact.html', context)