# Generated by Django 5.2.3 on 2025-07-08 04:17

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('quotes', '0006_quoteline_user'),
    ]

    operations = [
        migrations.CreateModel(
            name='AccountRequest',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('first_name', models.CharField(max_length=150)),
                ('last_name', models.CharField(max_length=150)),
                ('username', models.CharField(max_length=150, unique=True)),
                ('email', models.EmailField(max_length=254, unique=True)),
                ('submitted_at', models.DateTimeField(auto_now_add=True)),
                ('approved', models.BooleanField(default=False)),
                ('processed', models.BooleanField(default=False)),
            ],
        ),
    ]
