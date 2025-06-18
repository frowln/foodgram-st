from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from djoser.views import TokenCreateView, UserViewSet as DjoserUserViewSet
from django.contrib.auth import get_user_model
import logging
from .serializers import (
    IngredientSerializer, TagSerializer, RecipeSerializer,
    RecipeCreateUpdateSerializer, FavoriteSerializer,
    ShoppingCartSerializer, CustomTokenCreateSerializer,
    CustomUserSerializer
)
from .models import Ingredient, Tag, Recipe, Favorite, ShoppingCart

User = get_user_model()
logger = logging.getLogger(__name__)

class UserViewSet(DjoserUserViewSet):
    serializer_class = CustomUserSerializer

    @action(detail=False, methods=['get'])
    def me(self, request):
        if not request.user.is_authenticated:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

class CustomTokenCreateView(TokenCreateView):
    serializer_class = CustomTokenCreateSerializer

    def post(self, request, *args, **kwargs):
        logger.info(f"Login attempt with data: {request.data}")
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
            logger.info("Serializer validation passed")
            return self._action(serializer)
        except Exception as e:
            logger.error(f"Login error: {str(e)}")
            raise

    def _action(self, serializer):
        user = serializer.validated_data['user']
        logger.info(f"Creating token for user: {user.email}")
        token, created = Token.objects.get_or_create(user=user)
        logger.info(f"Token {'created' if created else 'retrieved'}: {token.key}")
        return Response({'auth_token': token.key})

class IngredientViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Ingredient.objects.all()
    serializer_class = IngredientSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None

    def get_queryset(self):
        name = self.request.query_params.get('name')
        queryset = Ingredient.objects.all()
        if name:
            return queryset.filter(name__istartswith=name)
        return queryset

class TagViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None

class RecipeViewSet(viewsets.ModelViewSet):
    queryset = Recipe.objects.all()
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return RecipeCreateUpdateSerializer
        return RecipeSerializer

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    @action(detail=True, methods=['post', 'delete'])
    def favorite(self, request, pk=None):
        recipe = self.get_object()
        
        if request.method == 'POST':
            favorite, created = Favorite.objects.get_or_create(
                user=request.user, recipe=recipe
            )
            serializer = FavoriteSerializer(favorite)
            return Response(serializer.data, 
                          status=status.HTTP_201_CREATED if created 
                          else status.HTTP_200_OK)
        
        Favorite.objects.filter(user=request.user, recipe=recipe).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post', 'delete'])
    def shopping_cart(self, request, pk=None):
        recipe = self.get_object()
        
        if request.method == 'POST':
            cart_item, created = ShoppingCart.objects.get_or_create(
                user=request.user, recipe=recipe
            )
            serializer = ShoppingCartSerializer(cart_item)
            return Response(serializer.data, 
                          status=status.HTTP_201_CREATED if created 
                          else status.HTTP_200_OK)
        
        ShoppingCart.objects.filter(user=request.user, recipe=recipe).delete()
        return Response(status=status.HTTP_204_NO_CONTENT) 