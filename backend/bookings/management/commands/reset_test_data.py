"""
python manage.py reset_test_data

Resets all booking/payment/payout test data so the Stripe payment flow
can be tested from scratch repeatedly without seeding properties again.

What it does:
  - Deletes all Payouts
  - Deletes all Payments
  - Deletes all Bookings
  - Resets every property back to 'available'
  - Resets seed_landlord_001's Stripe Connect fields (so onboarding can be re-tested)
"""

from django.core.management.base import BaseCommand
from django.db import transaction


class Command(BaseCommand):
    help = "Wipe all bookings/payments/payouts and reset properties to available"

    def add_arguments(self, parser):
        parser.add_argument(
            "--keep-connect",
            action="store_true",
            help="Keep the landlord Stripe Connect account (skip re-onboarding)",
        )

    def handle(self, *args, **options):
        from bookings.models import Booking
        from payments.models import Payment, Payout
        from properties.models import Property

        with transaction.atomic():
            payout_count = Payout.objects.count()
            Payout.objects.all().delete()
            self.stdout.write(f"  Deleted {payout_count} payout(s)")

            payment_count = Payment.objects.count()
            Payment.objects.all().delete()
            self.stdout.write(f"  Deleted {payment_count} payment(s)")

            booking_count = Booking.objects.count()
            Booking.objects.all().delete()
            self.stdout.write(f"  Deleted {booking_count} booking(s)")

            updated = Property.objects.exclude(status="available").exclude(status="unavailable").update(status="available")
            self.stdout.write(f"  Reset {updated} propert(ies) to available")

            if not options["keep_connect"]:
                from accounts.models import LandlordProfile
                LandlordProfile.objects.update(
                    stripe_account_id=None,
                    stripe_onboarding_complete=False,
                )
                self.stdout.write("  Cleared Stripe Connect fields on all landlord profiles")
            else:
                self.stdout.write("  Kept Stripe Connect accounts (--keep-connect)")

        self.stdout.write(self.style.SUCCESS("\nDone — ready for a fresh test run"))
        self.stdout.write("Run: python manage.py reset_test_data --keep-connect  (to skip re-onboarding)\n")
