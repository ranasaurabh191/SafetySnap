from django.db.models.signals import post_migrate
from django.dispatch import receiver
from django.contrib.auth import get_user_model
import os

User = get_user_model()

@receiver(post_migrate)
def create_superuser(sender, **kwargs):
    """Create superuser after migrations if it doesn't exist"""
    if sender.name == 'users':
        if not User.objects.filter(is_superuser=True).exists():
            username = os.environ.get('DJANGO_SUPERUSER_USERNAME', 'admin')
            email = os.environ.get('DJANGO_SUPERUSER_EMAIL', 'admin@safetysnap.com')
            password = os.environ.get('DJANGO_SUPERUSER_PASSWORD', 'admin123456')
            
            User.objects.create_superuser(
                username=username,
                email=email,
                password=password
            )
            print(f'✅ Superuser "{username}" created successfully')
