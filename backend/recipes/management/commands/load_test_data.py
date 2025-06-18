from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from recipes.models import Tag, Recipe, Ingredient, RecipeIngredient
from django.core.files.base import ContentFile
import random

User = get_user_model()

class Command(BaseCommand):
    help = 'Создаёт тестовых пользователей, теги и рецепты.'

    def handle(self, *args, **options):
        # Создание пользователей
        users = []
        for i in range(1, 4):
            user, created = User.objects.get_or_create(
                username=f'user{i}',
                defaults={'email': f'user{i}@test.com'}
            )
            if created:
                user.set_password('testpass123')
                user.save()
            users.append(user)
        self.stdout.write(self.style.SUCCESS('Созданы тестовые пользователи.'))

        # Создание тегов
        tag_data = [
            {'name': 'Завтрак', 'color': '#E26C2D', 'slug': 'breakfast'},
            {'name': 'Обед', 'color': '#49B64E', 'slug': 'lunch'},
            {'name': 'Ужин', 'color': '#8775D2', 'slug': 'dinner'},
        ]
        tags = []
        for data in tag_data:
            tag, _ = Tag.objects.get_or_create(**data)
            tags.append(tag)
        self.stdout.write(self.style.SUCCESS('Созданы теги.'))

        # Получаем ингредиенты
        ingredients = list(Ingredient.objects.all()[:10])

        # Создание рецептов
        for i, user in enumerate(users, 1):
            recipe = Recipe.objects.create(
                author=user,
                name=f'Тестовый рецепт {i}',
                text='Описание тестового рецепта',
                cooking_time=random.randint(10, 60),
            )
            # Добавляем картинку-заглушку
            recipe.image.save(f'test{i}.jpg', ContentFile(b'\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\x80\x00\x00\x00\x00\x00\xFF\xFF\xFF\x21\xF9\x04\x01\x00\x00\x00\x00\x2C\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02\x4C\x01\x00\x3B'))
            recipe.tags.set(tags[:random.randint(1, 3)])
            # Добавляем ингредиенты
            for ing in random.sample(ingredients, k=3):
                RecipeIngredient.objects.create(
                    recipe=recipe,
                    ingredient=ing,
                    amount=random.randint(1, 5)
                )
        self.stdout.write(self.style.SUCCESS('Созданы тестовые рецепты.')) 