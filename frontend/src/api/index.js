class Api {
  constructor(headers) {
    this._headers = headers;
  }

  checkResponse(res) {
    return new Promise((resolve, reject) => {
      if (res.status === 204) {
        return resolve(res);
      }
      
      // Добавляем проверку на тип контента
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        res.json()
          .then(data => {
            if (res.status < 400) {
              resolve(data);
            } else {
              reject(data);
            }
          })
          .catch(err => reject(err));
      } else {
        if (res.status < 400) {
          resolve(res);
        } else {
          reject(new Error(`HTTP error! status: ${res.status}`));
        }
      }
    });
  }

  checkFileDownloadResponse(res) {
    return new Promise((resolve, reject) => {
      if (res.status < 400) {
        return res.blob().then((blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "shopping-list";
          document.body.appendChild(a); // we need to append the element to the dom -> otherwise it will not work in firefox
          a.click();
          a.remove(); //afterwards we remove the element again
        });
      }
      reject();
    });
  }

  signin({ email, password }) {
    console.log('Sending signin request with data:', { email });
    
    // Создаем контроллер для отмены запроса по таймауту
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, 10000); // 10 секунд таймаут

    return fetch("/api/auth/token/login/", {
      method: "POST",
      headers: this._headers,
      body: JSON.stringify({
        email,
        password,
      }),
      signal: controller.signal
    })
    .then(res => {
      clearTimeout(timeout);
      console.log('Received response:', {
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries())
      });
      return this.checkResponse(res);
    })
    .then(data => {
      console.log('Parsed response data:', data);
      if (data.auth_token) {
        localStorage.setItem('token', data.auth_token);
      }
      return data;
    })
    .catch(err => {
      clearTimeout(timeout);
      console.error('Error during signin:', err);
      if (err.name === 'AbortError') {
        throw new Error('Запрос был отменен по таймауту. Пожалуйста, попробуйте снова.');
      }
      if (err.email) {
        throw new Error(err.email);
      }
      if (err.password) {
        throw new Error(err.password);
      }
      throw err;
    });
  }

  signout() {
    const token = localStorage.getItem("token");
    return fetch("/api/auth/token/logout/", {
      method: "POST",
      headers: {
        ...this._headers,
        authorization: `Token ${token}`,
      },
    }).then(this.checkResponse);
  }

  signup({ email, password, username, first_name, last_name }) {
    return fetch(`/api/users/`, {
      method: "POST",
      headers: this._headers,
      body: JSON.stringify({
        email,
        password,
        username,
        first_name,
        last_name,
      }),
    })
    .then(this.checkResponse)
    .catch(err => {
      console.error('Error during signup:', err);
      throw err;
    });
  }

  getUserData() {
    const token = localStorage.getItem("token");
    return fetch(`/api/users/me/`, {
      method: "GET",
      headers: {
        ...this._headers,
        authorization: `Token ${token}`,
      },
    }).then(this.checkResponse);
  }

  changePassword({ current_password, new_password }) {
    const token = localStorage.getItem("token");
    return fetch(`/api/users/set_password/`, {
      method: "POST",
      headers: {
        ...this._headers,
        authorization: `Token ${token}`,
      },
      body: JSON.stringify({ current_password, new_password }),
    }).then(this.checkResponse);
  }

  changeAvatar({ file }) {
    const token = localStorage.getItem("token");
    return fetch(`/api/users/me/avatar/`, {
      method: "PUT",
      headers: {
        ...this._headers,
        authorization: `Token ${token}`,
      },
      body: JSON.stringify({ avatar: file }),
    }).then(this.checkResponse);
  }

  deleteAvatar() {
    const token = localStorage.getItem("token");
    return fetch(`/api/users/me/avatar/`, {
      method: "DELETE",
      headers: {
        ...this._headers,
        authorization: `Token ${token}`,
      },
    }).then(this.checkResponse);
  }

  resetPassword({ email }) {
    return fetch(`/api/users/reset_password/`, {
      method: "POST",
      headers: {
        ...this._headers,
      },
      body: JSON.stringify({ email }),
    }).then(this.checkResponse);
  }

  // recipes

  getRecipes({
    page = 1,
    limit = 6,
    is_favorited = 0,
    is_in_shopping_cart = 0,
    author
  } = {}) {
    const token = localStorage.getItem("token");
    const authorization = token ? { authorization: `Token ${token}` } : {};
    return fetch(
      `/api/recipes/?page=${page}&limit=${limit}${
        author ? `&author=${author}` : ""
      }${is_favorited ? `&is_favorited=${is_favorited}` : ""}${
        is_in_shopping_cart ? `&is_in_shopping_cart=${is_in_shopping_cart}` : ""
      }`,
      {
        method: "GET",
        headers: {
          ...this._headers,
          ...authorization,
        },
      }
    )
    .then(this.checkResponse)
    .catch(err => {
      console.error('Error fetching recipes:', err);
      throw err;
    });
  }

  getRecipe({ recipe_id }) {
    const token = localStorage.getItem("token");
    const authorization = token ? { authorization: `Token ${token}` } : {};
    return fetch(`/api/recipes/${recipe_id}/`, {
      method: "GET",
      headers: {
        ...this._headers,
        ...authorization,
      },
    }).then(this.checkResponse);
  }

  createRecipe({
    name = "",
    image,
    cooking_time = 0,
    text = "",
    ingredients = [],
  }) {
    const token = localStorage.getItem("token");
    return fetch("/api/recipes/", {
      method: "POST",
      headers: {
        ...this._headers,
        authorization: `Token ${token}`,
      },
      body: JSON.stringify({
        name,
        image,
        cooking_time,
        text,
        ingredients,
      }),
    }).then(this.checkResponse);
  }

  updateRecipe(
    { name, recipe_id, image, cooking_time, text, ingredients },
    wasImageUpdated
  ) {
    // image was changed
    const token = localStorage.getItem("token");
    return fetch(`/api/recipes/${recipe_id}/`, {
      method: "PATCH",
      headers: {
        ...this._headers,
        authorization: `Token ${token}`,
      },
      body: JSON.stringify({
        name,
        id: recipe_id,
        image: wasImageUpdated ? image : undefined,
        cooking_time: Number(cooking_time),
        text,
        ingredients,
      }),
    }).then(this.checkResponse);
  }

  addToFavorites({ id }) {
    const token = localStorage.getItem("token");
    return fetch(`/api/recipes/${id}/favorite/`, {
      method: "POST",
      headers: {
        ...this._headers,
        authorization: `Token ${token}`,
      },
    }).then(this.checkResponse);
  }

  removeFromFavorites({ id }) {
    const token = localStorage.getItem("token");
    return fetch(`/api/recipes/${id}/favorite/`, {
      method: "DELETE",
      headers: {
        ...this._headers,
        authorization: `Token ${token}`,
      },
    }).then(this.checkResponse);
  }

  copyRecipeLink({ id }) {
    return fetch(`/api/recipes/${id}/get-link/`, {
      method: "GET",
      headers: {
        ...this._headers,
      },
    }).then(this.checkResponse);
  }

  getUser({ id }) {
    const token = localStorage.getItem("token");
    const authorization = token ? { authorization: `Token ${token}` } : {};
    return fetch(`/api/users/${id}/`, {
      method: "GET",
      headers: {
        ...this._headers,
        ...authorization,
      },
    }).then(this.checkResponse);
  }

  getUsers({ page = 1, limit = 6 }) {
    const token = localStorage.getItem("token");
    return fetch(`/api/users/?page=${page}&limit=${limit}`, {
      method: "GET",
      headers: {
        ...this._headers,
        authorization: `Token ${token}`,
      },
    }).then(this.checkResponse);
  }

  // subscriptions

  getSubscriptions({ page, limit = 6, recipes_limit = 3 }) {
    const token = localStorage.getItem("token");
    return fetch(
      `/api/users/subscriptions/?page=${page}&limit=${limit}&recipes_limit=${recipes_limit}`,
      {
        method: "GET",
        headers: {
          ...this._headers,
          authorization: `Token ${token}`,
        },
      }
    ).then(this.checkResponse);
  }

  deleteSubscriptions({ author_id }) {
    const token = localStorage.getItem("token");
    return fetch(`/api/users/${author_id}/subscribe/`, {
      method: "DELETE",
      headers: {
        ...this._headers,
        authorization: `Token ${token}`,
      },
    }).then(this.checkResponse);
  }

  subscribe({ author_id }) {
    const token = localStorage.getItem("token");
    return fetch(`/api/users/${author_id}/subscribe/`, {
      method: "POST",
      headers: {
        ...this._headers,
        authorization: `Token ${token}`,
      },
    }).then(this.checkResponse);
  }

  // ingredients
  getIngredients({ name }) {
    const token = localStorage.getItem("token");
    return fetch(`/api/ingredients/?name=${name}`, {
      method: "GET",
      headers: {
        ...this._headers,
      },
    }).then(this.checkResponse);
  }


  addToOrders({ id }) {
    const token = localStorage.getItem("token");
    return fetch(`/api/recipes/${id}/shopping_cart/`, {
      method: "POST",
      headers: {
        ...this._headers,
        authorization: `Token ${token}`,
      },
    }).then(this.checkResponse);
  }

  removeFromOrders({ id }) {
    const token = localStorage.getItem("token");
    return fetch(`/api/recipes/${id}/shopping_cart/`, {
      method: "DELETE",
      headers: {
        ...this._headers,
        authorization: `Token ${token}`,
      },
    }).then(this.checkResponse);
  }

  deleteRecipe({ recipe_id }) {
    const token = localStorage.getItem("token");
    return fetch(`/api/recipes/${recipe_id}/`, {
      method: "DELETE",
      headers: {
        ...this._headers,
        authorization: `Token ${token}`,
      },
    }).then(this.checkResponse);
  }

  downloadFile() {
    const token = localStorage.getItem("token");
    return fetch(`/api/recipes/download_shopping_cart/`, {
      method: "GET",
      headers: {
        ...this._headers,
        authorization: `Token ${token}`,
      },
    }).then(this.checkFileDownloadResponse);
  }
}

export default new Api({
  'content-type': 'application/json'
});
