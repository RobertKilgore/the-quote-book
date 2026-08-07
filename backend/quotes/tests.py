from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from .models import Quote, Signature, SignatureTimelineConfig
from scheduler.jobs import process_signature_timeline


class QuoteListSortingTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="sorttester",
            email="sorttester@example.com",
            password="secret123"
        )
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def test_rarity_sorting_is_applied_before_pagination(self):
        legendary = Quote.objects.create(created_by=self.user, approved=True, visible=True, rank="legendary")
        common = Quote.objects.create(created_by=self.user, approved=True, visible=True, rank="common")

        response = self.client.get("/api/quotes/?sort_by=rarity&sort_direction=desc&page=1&page_size=1")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["results"][0]["id"], legendary.id)

        next_page = self.client.get("/api/quotes/?sort_by=rarity&sort_direction=desc&page=2&page_size=1")
        self.assertEqual(next_page.status_code, 200)
        self.assertEqual(next_page.data["results"][0]["id"], common.id)


class QuoteListPaginationTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="tester",
            email="tester@example.com",
            password="secret123"
        )
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def test_refusal_by_current_user_creates_a_refused_signature(self):
        quote = Quote.objects.create(created_by=self.user, approved=True, visible=True)
        quote.participants.add(self.user)

        response = self.client.post("/api/signatures/refuse/", {"quote_id": quote.id})

        self.assertEqual(response.status_code, 200)
        self.assertTrue(Signature.objects.filter(quote=quote, user=self.user, refused=True).exists())

    def test_refusal_allows_placeholder_signature_rows(self):
        quote = Quote.objects.create(created_by=self.user, approved=True, visible=True)
        quote.participants.add(self.user)
        Signature.objects.create(quote=quote, user=self.user)

        response = self.client.post("/api/signatures/refuse/", {"quote_id": quote.id})

        self.assertEqual(response.status_code, 200)
        self.assertTrue(Signature.objects.filter(quote=quote, user=self.user, refused=True).exists())

    def test_refusing_an_already_signed_signature_is_rejected(self):
        quote = Quote.objects.create(created_by=self.user, approved=True, visible=True)
        quote.participants.add(self.user)
        signature = Signature.objects.create(quote=quote, user=self.user, signature_image="dummy.png")

        response = self.client.post("/api/signatures/refuse/", {"quote_id": quote.id})

        self.assertEqual(response.status_code, 400)
        signature.refresh_from_db()
        self.assertFalse(signature.refused)
        self.assertTrue(signature.signature_image)

    def test_editing_quote_clears_non_guest_signatures_and_resets_deadline(self):
        admin_user = get_user_model().objects.create_user(
            username="editquoteadmin",
            email="editquoteadmin@example.com",
            password="secret123",
            is_superuser=True,
            is_staff=True,
        )
        admin_client = APIClient()
        admin_client.force_authenticate(admin_user)

        quote = Quote.objects.create(created_by=self.user, approved=True, visible=True)
        quote.participants.add(self.user)
        Signature.objects.create(quote=quote, user=self.user, signature_image="dummy.png")
        guest_signature = Signature.objects.create(quote=quote, user=None, guest_name="Guest")

        config = SignatureTimelineConfig.objects.create(initial_window_seconds=10 * 86400)

        response = admin_client.put(
            f"/api/quotes/{quote.id}/",
            {
                "date": "2026-01-01",
                "time": "12:00",
                "visible": True,
                "approved": True,
                "redacted": False,
                "lines": "[]",
                "participants": "[1]",
                "quote_notes": "",
                "quote_source": "",
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(Signature.objects.filter(quote=quote, user__isnull=False).count(), 1)
        self.assertTrue(Signature.objects.filter(id=guest_signature.id).exists())

        participant_signature = Signature.objects.get(quote=quote, user=self.user)
        self.assertIsNotNone(participant_signature.deadline_at)
        self.assertGreaterEqual(
            participant_signature.deadline_at,
            timezone.now() + timezone.timedelta(seconds=config.initial_window_seconds - 5),
        )
        self.assertLessEqual(
            participant_signature.deadline_at,
            timezone.now() + timezone.timedelta(seconds=config.initial_window_seconds + 5),
        )

    def test_retrieving_quote_does_not_initialize_missing_deadline_on_read(self):
        quote = Quote.objects.create(created_by=self.user, approved=True, visible=True)
        quote.participants.add(self.user)
        signature = Signature.objects.create(quote=quote, user=self.user, deadline_at=None)

        response = self.client.get(f"/api/quotes/{quote.id}/")

        self.assertEqual(response.status_code, 200)
        signature.refresh_from_db()
        self.assertIsNone(signature.deadline_at)
        self.assertIsNone(response.data["participant_status"][0].get("deadline_at"))

    def test_retrieving_quote_marks_expired_signature_as_refused(self):
        quote = Quote.objects.create(created_by=self.user, approved=True, visible=True)
        quote.participants.add(self.user)
        signature = Signature.objects.create(
            quote=quote,
            user=self.user,
            deadline_at=timezone.now() - timezone.timedelta(seconds=5),
        )

        response = self.client.get(f"/api/quotes/{quote.id}/")

        self.assertEqual(response.status_code, 200)
        signature.refresh_from_db()
        self.assertTrue(signature.refused)
        self.assertTrue(signature.expired_at is not None)

    def test_retrieving_quote_with_expired_signature_marks_it_refused(self):
        quote = Quote.objects.create(created_by=self.user, approved=True, visible=True)
        quote.participants.add(self.user)
        signature = Signature.objects.create(
            quote=quote,
            user=self.user,
            deadline_at=timezone.now() - timezone.timedelta(seconds=5),
        )

        response = self.client.get(f"/api/quotes/{quote.id}/")

        self.assertEqual(response.status_code, 200)
        signature.refresh_from_db()
        self.assertTrue(signature.refused)
        self.assertIsNone(signature.deadline_at)

    def test_scheduler_process_signature_timeline_uses_each_participant_deadline(self):
        quote = Quote.objects.create(created_by=self.user, approved=True, visible=True)
        quote.participants.add(self.user)
        signature = Signature.objects.create(
            quote=quote,
            user=self.user,
            deadline_at=timezone.now() - timezone.timedelta(seconds=5),
        )

        process_signature_timeline(now=timezone.now())

        signature.refresh_from_db()
        self.assertTrue(signature.refused)
        self.assertIsNotNone(signature.expired_at)

    def test_quote_list_returns_paginated_results(self):
        response = self.client.get("/api/quotes/")

        self.assertEqual(response.status_code, 200)
        self.assertIn("results", response.data)
        self.assertIn("count", response.data)

    def test_quote_list_is_ordered_stably(self):
        older_quote = Quote.objects.create(created_by=self.user, approved=True, visible=True)
        newer_quote = Quote.objects.create(created_by=self.user, approved=True, visible=True)

        response = self.client.get("/api/quotes/")

        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.data["results"]), 2)
        self.assertEqual(response.data["results"][0]["id"], newer_quote.id)
        self.assertEqual(response.data["results"][1]["id"], older_quote.id)

    def test_submitted_unapproved_quotes_count_for_non_admin(self):
        Quote.objects.create(created_by=self.user, approved=False, visible=False)

        response = self.client.get("/api/quotes/submitted/count/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)

    def test_quote_list_includes_participant_deadline_fields(self):
        quote = Quote.objects.create(created_by=self.user, approved=True, visible=True)
        quote.participants.add(self.user)
        signature = Signature.objects.create(quote=quote, user=self.user, deadline_at=timezone.now() + timezone.timedelta(days=7))

        response = self.client.get("/api/quotes/")

        self.assertEqual(response.status_code, 200)
        participant_status = response.data["results"][0]["participant_status"]
        self.assertTrue(any(item.get("deadline_at") for item in participant_status))
        self.assertEqual(participant_status[0]["signature_id"], signature.id)

    def test_quote_serializer_only_includes_active_signed_rows(self):
        other_user = get_user_model().objects.create_user(
            username="othersigner",
            email="othersigner@example.com",
            password="secret123",
        )
        quote = Quote.objects.create(created_by=self.user, approved=True, visible=True)
        quote.participants.add(self.user, other_user)
        Signature.objects.create(quote=quote, user=self.user, signature_image="dummy.png")
        Signature.objects.create(quote=quote, user=other_user, refused=True)

        response = self.client.get(f"/api/quotes/{quote.id}/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["signatures"]), 2)
        self.assertEqual(
            {entry["user"] for entry in response.data["signatures"]},
            {self.user.id, other_user.id},
        )

    def test_admin_clear_resets_deadline_without_deleting_the_signature_row(self):
        admin_user = get_user_model().objects.create_user(
            username="adminclear",
            email="adminclear@example.com",
            password="secret123",
            is_superuser=True,
            is_staff=True,
        )
        quote = Quote.objects.create(created_by=self.user, approved=True, visible=True)
        quote.participants.add(self.user)
        signature = Signature.objects.create(
            quote=quote,
            user=self.user,
            signature_image="dummy.png",
            deadline_at=timezone.now() + timezone.timedelta(days=2),
        )

        admin_client = APIClient()
        admin_client.force_authenticate(admin_user)
        response = admin_client.post(f"/api/signatures/{signature.id}/admin-clear/")

        self.assertEqual(response.status_code, 200)
        self.assertFalse(Signature.objects.filter(id=signature.id).exists())

    def test_admin_settings_endpoint_returns_and_updates_signature_windows(self):
        admin_user = get_user_model().objects.create_user(
            username="adminsettings",
            email="adminsettings@example.com",
            password="secret123",
            is_superuser=True,
            is_staff=True,
        )
        admin_client = APIClient()
        admin_client.force_authenticate(admin_user)

        response = admin_client.get("/api/admin/settings/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("initial_window_days", response.data)
        self.assertIn("reopen_window_days", response.data)

        update_response = admin_client.patch(
            "/api/admin/settings/",
            {"initial_window_days": 10, "reopen_window_days": 5},
            format="json",
        )

        self.assertEqual(update_response.status_code, 200)
        self.assertEqual(update_response.data["initial_window_days"], 10)
        self.assertEqual(update_response.data["reopen_window_days"], 5)

        second_response = admin_client.patch(
            "/api/admin/settings/",
            {"initial_window_seconds": 60, "reopen_window_seconds": 120},
            format="json",
        )

        self.assertEqual(second_response.status_code, 200)
        self.assertEqual(second_response.data["initial_window_seconds"], 60)
        self.assertEqual(second_response.data["reopen_window_seconds"], 120)

        config = SignatureTimelineConfig.objects.order_by("-created_at").first()
        self.assertEqual(config.initial_window_seconds, 60)
        self.assertEqual(config.reopen_window_seconds, 120)
