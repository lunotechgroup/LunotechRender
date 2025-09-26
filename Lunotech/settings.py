import os
from pathlib import Path
from dotenv import load_dotenv
import dj_database_url

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from .env file for local development
load_dotenv(os.path.join(BASE_DIR, '.env'))


# --- SECURITY SETTINGS ---
# The key is loaded from an environment variable.
# WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv('SECRET_KEY')

# Debug mode is enabled/disabled based on an environment variable.
# WARNING: don't run with debug turned on in production!
DEBUG = os.getenv('DEBUG', 'False') == 'True'


# --- HOSTS SETTINGS ---
# Your allowed hosts for production on Liara and local development.
ALLOWED_HOSTS = [
    'lunotech.ir',
    'www.lunotech.ir',
]
RENDER_EXTERNAL_HOSTNAME = os.environ.get('RENDER_EXTERNAL_HOSTNAME')
if RENDER_EXTERNAL_HOSTNAME:
    ALLOWED_HOSTS.append(RENDER_EXTERNAL_HOSTNAME)


# --- APPLICATION DEFINITION ---
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'whitenoise.runserver_nostatic',  # For serving static files efficiently
    'django.contrib.staticfiles',
    # Add your own apps for Lunotech here
    # 'my_app',
    'main',
    'tinymce',
]


# --- MIDDLEWARE ---
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware', # WhiteNoise middleware
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# IMPORTANT: Change 'your_project_name' to your project's actual name
ROOT_URLCONF = 'Lunotech.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'templates')],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# IMPORTANT: Change 'your_project_name' to your project's actual name
WSGI_APPLICATION = 'Lunotech.wsgi.application'


# --- DATABASE ---
# https://docs.djangoproject.com/en/stable/ref/settings/#databases
#
# Using SQLite. In production on Liara, the database file MUST be on a
# persistent disk (configured in liara.json) to prevent data loss.
# The path '/data/db.sqlite3' points to the 'database' disk.
# For local development, it will create the file in your project's base directory.

if os.getenv('LIARA_ENVIRONMENT') == 'production':
    # Production on Liara: Path on the persistent disk
    DB_PATH = os.path.join('/data', 'db.sqlite3')
else:
    # Development: Path in your local project folder
    DB_PATH = BASE_DIR / 'db.sqlite3'

DATABASES = {
    'default': dj_database_url.config(
        default='sqlite:///db.sqlite3',
        conn_max_age=600
    )
}


# --- PASSWORD VALIDATION ---
# https://docs.djangoproject.com/en/stable/ref/settings/#auth-password-validators
AUTH_PASSWORD_VALIDATORS = [
    { 'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator', },
    { 'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', },
    { 'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator', },
    { 'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator', },
]


# --- INTERNATIONALIZATION ---
# https://docs.djangoproject.com/en/stable/topics/i18n/
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True


# --- STATIC FILES (CSS, JavaScript, Images) ---
# https://docs.djangoproject.com/en/stable/howto/static-files/
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'


# --- DEFAULT PRIMARY KEY FIELD TYPE ---
# https://docs.djangoproject.com/en/stable/ref/settings/#default-auto-field
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# --- MEDIA FILES (User-Uploaded Content) ---
# URL that serves the media files.
MEDIA_URL = '/media/'

# The absolute path to the folder where media files will be stored.
# On Liara, this will point to a persistent disk.
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')


# --- SECURITY SETTINGS for Production ---
# These settings are automatically applied when DEBUG is False.
if not DEBUG:
    CSRF_COOKIE_SECURE = True
    SESSION_COOKIE_SECURE = True
    SECURE_SSL_REDIRECT = True
    SECURE_HSTS_SECONDS = 31536000  # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
