import { Card, Title, Pagination, CardList, Container, Main, CheckboxGroup  } from '../../components'
import styles from './styles.module.css'
import { useRecipes } from '../../utils/index.js'
import { useEffect, useState } from 'react'
import api from '../../api'
import MetaTags from 'react-meta-tags'

const HomePage = ({ updateOrders }) => {
  const [error, setError] = useState(null);
  const {
    recipes,
    setRecipes,
    recipesCount,
    setRecipesCount,
    recipesPage,
    setRecipesPage,
    handleLike,
    handleAddToCart
  } = useRecipes()

  const getRecipes = ({ page = 1 }) => {
    setError(null);
    api
      .getRecipes({ page })
      .then(res => {
        const { results, count } = res
        setRecipes(results)
        setRecipesCount(count)
      })
      .catch(err => {
        console.error('Error loading recipes:', err);
        setError('Произошла ошибка при загрузке рецептов. Пожалуйста, попробуйте позже.');
      });
  }

  useEffect(() => {
    getRecipes({ page: recipesPage })
  }, [recipesPage])

  return <Main>
    <Container>
      <MetaTags>
        <title>Рецепты</title>
        <meta name="description" content="Фудграм - Рецепты" />
        <meta property="og:title" content="Рецепты" />
      </MetaTags>
      <div className={styles.title}>
        <Title title='Рецепты' />
      </div>
      {error && <div className={styles.error}>{error}</div>}
      {!error && recipes.length > 0 && <CardList>
        {recipes.map(card => <Card
          {...card}
          key={card.id}
          updateOrders={updateOrders}
          handleLike={handleLike}
          handleAddToCart={handleAddToCart}
        />)}
      </CardList>}
      {!error && recipes.length === 0 && <div className={styles.empty}>Рецепты не найдены</div>}
      {!error && recipes.length > 0 && <Pagination
        count={recipesCount}
        limit={6}
        page={recipesPage}
        onPageChange={page => setRecipesPage(page)}
      />}
    </Container>
  </Main>
}

export default HomePage

