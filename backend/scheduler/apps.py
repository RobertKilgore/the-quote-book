from django.apps import AppConfig
import os
from django.db import close_old_connections


class SchedulerConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'scheduler'

    def ready(self):
        if os.environ.get("RUN_MAIN") != "true":
            return

        print("[scheduler] starting background scheduler")
        from apscheduler.schedulers.background import BackgroundScheduler
        from apscheduler.jobstores.memory import MemoryJobStore
        from django_apscheduler.jobstores import register_events
        from .jobs import process_signature_timeline

        scheduler = BackgroundScheduler(job_defaults={'coalesce': True, 'max_instances': 1, 'misfire_grace_time': 60})
        scheduler.add_jobstore(MemoryJobStore(), "default")

        scheduler.add_job(
            process_signature_timeline,
            trigger='interval',
            seconds=3,
            id='process_signature_timeline',
            replace_existing=True,
        )

        register_events(scheduler)
        scheduler.start()