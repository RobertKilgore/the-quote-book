from allauth.account.adapter import DefaultAccountAdapter

class NoAutoActivateAccountAdapter(DefaultAccountAdapter):
    def is_open_for_signup(self, request):
        return True

    def save_user(self, request, user, form, commit=True):
        user = super().save_user(request, user, form, False)
        user.is_active = False  # Deactivate until admin approves
        if commit:
            user.save()
        return user