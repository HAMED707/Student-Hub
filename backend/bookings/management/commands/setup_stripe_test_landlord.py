"""
python manage.py setup_stripe_test_landlord

Bypasses the Stripe Connect onboarding UI entirely.
Creates a fully-verified test Express account via API and saves it to
seed_landlord_001's profile, so you can test payouts without touching
the browser onboarding flow.

Only works in Stripe test mode (sandbox).
"""

import time

import stripe
from django.conf import settings
from django.core.management.base import BaseCommand

stripe.api_key = settings.STRIPE_SECRET_KEY


class Command(BaseCommand):
    help = "Create a fully-verified Stripe Connect test account for seed_landlord_001"

    def add_arguments(self, parser):
        parser.add_argument("--username", default="seed_landlord_001")

    def handle(self, *args, **options):
        from accounts.models import LandlordProfile, Users

        try:
            user = Users.objects.get(username=options["username"])
        except Users.DoesNotExist:
            self.stdout.write(self.style.ERROR(f"User '{options['username']}' not found"))
            return

        profile = user.landlord_profile

        # ── 1. Clear any broken existing account ──────────────────────────
        if profile.stripe_account_id:
            self.stdout.write(f"  Clearing stale account_id: {profile.stripe_account_id}")
            profile.stripe_account_id = None
            profile.stripe_onboarding_complete = False
            profile.save(update_fields=["stripe_account_id", "stripe_onboarding_complete"])

        # ── 2. Create Express account (minimal — avoid validation errors) ──
        self.stdout.write("Creating Stripe Express account...")
        try:
            account = stripe.Account.create(
                type="express",
                country="AE",
                capabilities={"transfers": {"requested": True}},
                tos_acceptance={
                    "date": int(time.time()),
                    "ip": "8.8.8.8",
                },
            )
            self.stdout.write(f"  account_id = {account.id}")
        except Exception as exc:
            self.stdout.write(self.style.ERROR(f"Account creation failed: {exc}"))
            return

        # ── 3. Add test bank account ──────────────────────────────────────
        self.stdout.write("Adding test bank account...")
        try:
            stripe.Account.create_external_account(
                account.id,
                external_account={
                    "object": "bank_account",
                    "country": "AE",
                    "currency": "aed",
                    "account_number": "AE070331234567890123456",
                },
            )
            self.stdout.write("  Bank account added")
        except Exception as exc:
            self.stdout.write(self.style.WARNING(f"  Bank account step failed (transfers may still work in test mode): {exc}"))

        # ── 4. Check resulting status ─────────────────────────────────────
        self.stdout.write("Checking account status...")
        try:
            refreshed = stripe.Account.retrieve(account.id)
            payouts_enabled  = refreshed.payouts_enabled
            charges_enabled  = refreshed.charges_enabled
            details_submitted = refreshed.details_submitted
            self.stdout.write(f"  payouts_enabled   = {payouts_enabled}")
            self.stdout.write(f"  charges_enabled   = {charges_enabled}")
            self.stdout.write(f"  details_submitted = {details_submitted}")
        except Exception as exc:
            self.stdout.write(self.style.WARNING(f"  Could not retrieve status: {exc}"))
            payouts_enabled = False

        # ── 5. Save to profile ────────────────────────────────────────────
        profile.stripe_account_id = account.id
        profile.stripe_onboarding_complete = True   # force-set for test purposes
        profile.save(update_fields=["stripe_account_id", "stripe_onboarding_complete"])
        self.stdout.write(f"\nSaved to {user.username}'s profile")

        if not payouts_enabled:
            self.stdout.write(self.style.WARNING(
                "\nNote: payouts_enabled is still False on Stripe's side — "
                "the test transfer in check-in may still fail. "
                "If it does, Stripe may need additional test data. "
                "Try running the check-in anyway — in test mode transfers often "
                "succeed even when payouts_enabled shows False."
            ))
        else:
            self.stdout.write(self.style.SUCCESS("\nDone — skip steps 7 & 8, go straight to step 9 (check-in)"))
