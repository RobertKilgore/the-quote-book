from django.apps import AppConfig


class SchedulerConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'scheduler'

    def ready(self):
            from apscheduler.schedulers.background import BackgroundScheduler
            from django_apscheduler.jobstores import DjangoJobStore, register_events
            from .jobs import auto_refuse_stale_quotes

            scheduler = BackgroundScheduler()
            scheduler.add_jobstore(DjangoJobStore(), "default")

            # Every day at midnight
            scheduler.add_job(
                auto_refuse_stale_quotes,
                trigger='cron',
                hour=0,
                minute=0,
                id='auto_refuse_stale_quotes',
                replace_existing=True,
            )

            register_events(scheduler)
            scheduler.start()