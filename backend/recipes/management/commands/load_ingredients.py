import csv
from django.core.management.base import BaseCommand
from recipes.models import Ingredient
from django.conf import settings
import os

class Command(BaseCommand):
    help = 'Загружает ингредиенты из data/ingredients.csv'

    def handle(self, *args, **options):
        # Путь к data/ingredients.csv на уровень выше backend
        file_path = os.path.abspath(os.path.join(settings.BASE_DIR, '..', 'data', 'ingredients.csv'))
        if not os.path.exists(file_path):
            self.stdout.write(self.style.ERROR(f'Файл {file_path} не найден.'))
            return
        with open(file_path, encoding='utf-8') as csvfile:
            reader = csv.reader(csvfile)
            count = 0
            for row in reader:
                if len(row) != 2:
                    continue
                name, measurement_unit = row
                if name == 'name' and measurement_unit == 'measurement_unit':
                    continue  # пропускаем заголовок
                obj, created = Ingredient.objects.get_or_create(
                    name=name.strip(),
                    measurement_unit=measurement_unit.strip()
                )
                if created:
                    count += 1
            self.stdout.write(self.style.SUCCESS(f'Загружено {count} ингредиентов.')) 