from django.contrib import admin
from django.core.exceptions import ValidationError
from .models import User

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['username', 'email', 'first_name', 'last_name', 'role', 'phone', 'is_active']
    search_fields = ['username', 'email', 'first_name', 'last_name', 'phone']
    list_filter = ['role', 'is_active']

    def save_model(self, request, obj, form, change):
        # Run full_clean() to trigger our validate_phone() method
        try:
            obj.full_clean()
        except ValidationError as e:
            # If validation fails, show the error and stop saving
            for message in e.messages:
                self.message_user(request, f"Validation Error: {message}", level="error")
            return  # Stop execution here; user is NOT saved
        
        # Only save if validation passes
        super().save_model(request, obj, form, change)
        
    def add_view(self, request, form_url='', extra_context=None):
        # Ensure the 'phone' field is required visually too
        form_opts = dict(formfield_overrides={})
        form_opts['exclude'] = []
        form_opts.update(extra_context or {})
        return super().add_view(request, form_url, form_opts)