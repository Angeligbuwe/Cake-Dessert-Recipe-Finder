
const SEARCH_API_URL = "https://www.themealdb.com/api/json/v1/1/search.php?s=";
const RANDOM_API_URL = "https://www.themealdb.com/api/json/v1/1/random.php";
const DESSERT_LIST_URL = "https://www.themealdb.com/api/json/v1/1/filter.php?c=Dessert";
const LOOKUP_API_URL = "https://www.themealdb.com/api/json/v1/1/lookup.php?i=";


const searchform = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const resultsGrid = document.getElementById("results-grid");
const messageArea = document.getElementById("message-area");
const randomButton = document.getElementById("random-cake-button");

const modal = document.getElementById("recipe-modal");
const modalContent = document.getElementById("recipe-details-content");
const modalCloseBtn = document.getElementById("close-modal-btn");
const themeToggle = document.getElementById("theme-toggle");



themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
});


searchform.addEventListener("submit", function (e) {
  e.preventDefault();

  const searchTerm = searchInput.value.trim();
  if (searchTerm) {
    searchRecipes(searchTerm);
  } else {
    showMessage("Please enter a cake search term", true);
  }
});


async function searchRecipes(query) {
  showMessage(`Searching "${query}"...`, false, true);
  resultsGrid.innerHTML = "";

  try {
    const response = await fetch(`${SEARCH_API_URL}${query}`);
    if (!response.ok) throw new Error("Network error");

    const data = await response.json();
    clearMessage();

    if (data.meals) {
      displayRecipes(data.meals);
    } else {
      showMessage(`No recipes found for "${query}".`);
    }
  } catch (error) {
    showMessage("Something went wrong, please try again.", true);
  }
}


function showMessage(message, isError = false, isLoading = false) {
  messageArea.textContent = message;
  messageArea.className = "message";

  if (isError) messageArea.classList.add("error");
  if (isLoading) messageArea.classList.add("loading");
}

function clearMessage() {
  messageArea.textContent = "";
  messageArea.className = "message";
}



function displayRecipes(recipes) {
  resultsGrid.innerHTML = "";

  if (!recipes || recipes.length === 0) {
    showMessage("No recipes to display.");
    return;
  }

  recipes.forEach((recipe) => {
    const recipeDiv = document.createElement("div");
    recipeDiv.classList.add("recipe-item");
    recipeDiv.dataset.id = recipe.idMeal;

    recipeDiv.innerHTML = `
      <img src="${recipe.strMealThumb}" alt="${recipe.strMeal}" loading="lazy">
      <h3>${recipe.strMeal}</h3>
      <button class="save-btn" data-id="${recipe.idMeal}">Save</button>
    `;

    resultsGrid.appendChild(recipeDiv);
  });
}


randomButton.addEventListener("click", getRandomCakes);

async function getRandomCakes() {
  showMessage("Fetching random cake...", false, true);
  resultsGrid.innerHTML = "";

  try {
    const response = await fetch(RANDOM_API_URL);
    if (!response.ok) throw new Error("Fetch error");

    const data = await response.json();
    clearMessage();

    if (data.meals) {
      displayRecipes(data.meals);
    } else {
      showMessage("Unable to fetch random recipe.", true);
    }
  } catch (error) {
    showMessage("Connection error. Try again.", true);
  }
}


resultsGrid.addEventListener("click", (e) => {
  if (e.target.classList.contains("save-btn")) {
    e.stopPropagation();
    const id = e.target.dataset.id;
    saveRecipe(id);
  }
});

function saveRecipe(id) {
  let saved = JSON.parse(localStorage.getItem("savedRecipes")) || [];

  if (!saved.includes(id)) {
    saved.push(id);
    localStorage.setItem("savedRecipes", JSON.stringify(saved));
    alert("Recipe saved!");
  } else {
    alert("Already saved!");
  }
}


function showModal() {
  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  modal.classList.add("hidden");
  document.body.style.overflow = "";
}

modalCloseBtn.addEventListener("click", closeModal);

modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    closeModal();
  }
});


resultsGrid.addEventListener("click", (e) => {
  const card = e.target.closest(".recipe-item");

  
  if (!card || e.target.classList.contains("save-btn") || e.target.classList.contains("remove-btn")) {
    return;
  }

  const id = card.dataset.id;
  getRecipeDetails(id);
});


async function getRecipeDetails(id) {
  modalContent.innerHTML = `<p class="message loading">Loading details...</p>`;
  showModal();

  try {
    const response = await fetch(`${LOOKUP_API_URL}${id}`);
    if (!response.ok) throw new Error("Details fetch error");

    const data = await response.json();

    if (data.meals && data.meals.length > 0) {
      displayRecipeDetails(data.meals[0]);
    } else {
      modalContent.innerHTML = `<p class="message error">Could not load details.</p>`;
    }
  } catch (error) {
    modalContent.innerHTML = `<p class="message error">Failed to load recipe details.</p>`;
  }
}


function getYouTubeID(url) {
  if (!url) return "";
  const byParam = url.split("v=")[1];
  if (byParam) return byParam.split("&")[0];
  const parts = url.split("/");
  return parts.pop();
}


function displayRecipeDetails(recipe) {
  const ingredients = [];

  for (let i = 1; i <= 20; i++) {
    const ing = recipe[`strIngredient${i}`];
    const measure = recipe[`strMeasure${i}`];

    if (ing && ing.trim()) {
      ingredients.push(`<li>${measure ? measure : ""} ${ing}</li>`);
    } else {
      break;
    }
  }

  const instructions = recipe.strInstructions
    ? recipe.strInstructions.replace(/\r?\n/g, "<br>")
    : "Instructions not available.";

  const youtubeHTML = recipe.strYoutube
    ? `
      <h3>Video</h3>
      <div class="video-wrapper">
        <iframe src="https://www.youtube.com/embed/${getYouTubeID(
          recipe.strYoutube
        )}" allowfullscreen></iframe>
      </div>
    `
    : "";

  const sourceHTML = recipe.strSource
    ? `
      <div class="source-wrapper">
        <a href="${recipe.strSource}" target="_blank">View Original Source</a>
      </div>
    `
    : "";

  modalContent.innerHTML = `
    <div class="recipe-card">
      <img src="${recipe.strMealThumb}" alt="${recipe.strMeal}" loading="lazy">
      <h2>${recipe.strMeal}</h2>
      ${recipe.strCategory ?
      `<h3>Category: ${recipe.strCategory}</h3>` : ""}
      ${recipe.strArea ?
      `<h3>Area: ${recipe.strArea}</h3>` : ""}

      ${ingredients.length? 
      `<h3>Ingredients</h3><ul>${ingredients.join("")}</ul>` : ""
      }

      <h3>Instructions</h3>
      <p>${instructions}</p>

      ${youtubeHTML}
      ${sourceHTML}
    </div>
  `;
}


document.getElementById("saved-link").addEventListener("click", showSavedRecipes);

async function showSavedRecipes() {
  const saved = JSON.parse(localStorage.getItem("savedRecipes")) || [];

  resultsGrid.innerHTML = "";

  if (saved.length === 0) {
    resultsGrid.innerHTML = `<p>No saved recipes yet.</p>`;
    return;
  }

  for (let id of saved) {
    const res = await fetch(`${LOOKUP_API_URL}${id}`);
    const data = await res.json();

    if (!data.meals || data.meals.length === 0) continue;

    const recipe = data.meals[0];

    const recipeDiv = document.createElement("div");
    recipeDiv.classList.add("recipe-item");
    recipeDiv.dataset.id = recipe.idMeal;

    recipeDiv.innerHTML = `
      <img src="${recipe.strMealThumb}" alt="${recipe.strMeal}">
      <h3>${recipe.strMeal}</h3>
      <button class="remove-btn" data-id="${recipe.idMeal}">Remove ❌</button>
    `;

    resultsGrid.appendChild(recipeDiv);
  }
}


resultsGrid.addEventListener("click", (e) => {
  if (e.target.classList.contains("remove-btn")) {
    e.stopPropagation();
    const id = e.target.dataset.id;

    let saved = JSON.parse(localStorage.getItem("savedRecipes")) || [];
    saved = saved.filter((x) => x !== id);

    localStorage.setItem("savedRecipes", JSON.stringify(saved));
    showSavedRecipes();
  }
  
});






