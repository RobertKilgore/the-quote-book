from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from .models import Quote


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
