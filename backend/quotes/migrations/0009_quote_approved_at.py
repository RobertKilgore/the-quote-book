# Generated by Django 5.2.3 on 2025-07-10 02:09

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('quotes', '0008_remove_accountrequest_processed'),
    ]

    operations = [
        migrations.AddField(
            model_name='quote',
            name='approved_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
