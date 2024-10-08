const global = {
  currentPage: window.location.pathname,
  search: {
    term: '',
    type: '',
    page: 1,
    totalPages: 1,
    totalResults: 0,
  },
  api: {
    apiToken:
      'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJmNTQwMGM4N2FmZTEyMzkzZGMyZTM1YzUwNDQwM2JkMCIsIm5iZiI6MTcyNTg2MTQ3OS42NjQzNTYsInN1YiI6IjY0OWIyM2I3MGU1YWJhMDBjNTkxYWUzYiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ._raW47XBufu1iIJ5yMMzzPt51cTtPOWSkLPOkfOhGdA',
    apiUrl: 'https://api.themoviedb.org/3/',
  },
}

const options = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${global.api.apiToken}`,
  },
}

const languages = {
  en: 'en-GB',
  cs: 'cs-CS',
  de: 'de-DE',
  ar: 'ar-SA',
  fr: 'fr-FR',
  it: 'it-IT',
  chi: 'zh-CN',
}
const baseImageUrl = 'https://image.tmdb.org/t/p/w500' // base URL for images

async function fetchData(url, opt) {
  try {
    showSpinner()
    const response = await fetch(url, opt)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()

    hideSpinner()

    renderMovies(data.results)

    return data
  } catch (error) {
    console.log(error)
  }
}

// Make Request To Search
async function searchAPIData() {
  const lang = localStorage.getItem('lang')

  const languageCode = languages[lang]
  try {
    showSpinner()
    const response = await fetch(
      `${global.api.apiUrl}search/${global.search.type}?query=${global.search.term}&language=${languageCode}&page=${global.search.page}`,
      options
    )
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()

    hideSpinner()

    return data
  } catch (error) {
    console.log(error)
  }
}

// Spinner
function showSpinner() {
  document.querySelector('.spinner').classList.add('show')
}
// Hide Spinner
function hideSpinner() {
  document.querySelector('.spinner').classList.remove('show')
}

// Get Language
function getLanguage(e) {
  let lang =
    e?.target?.getAttribute('data-lg') || localStorage.getItem('lang') || 'en'
  localStorage.setItem('lang', lang)
  const languageCode = languages[lang]
  const languagesLink = document.querySelectorAll('#languages .nav-link img')
  const entpoint = 'movie/popular'

  languagesLink.forEach((link) => {
    if (link.getAttribute('data-lg') === lang) {
      link.style.borderBottom = '2px solid var(--color-secondary)'
    } else {
      link.style.border = 'none'
    }
  })

  const popularMovies = document.querySelector('#popular-movies')

  if (popularMovies) {
    popularMovies.innerHTML = ''
  }
  if (languageCode) {
    urlLink = `${global.api.apiUrl}${entpoint}?language=${languageCode}&page=1`
    fetchData(urlLink, options)
  }
}

// Search Movies/Shows
async function search() {
  const queryString = window.location.search
  const urlParams = new URLSearchParams(queryString)

  global.search.type = urlParams.get('type')
  global.search.term = urlParams.get('search-term')

  if (global.search.term !== '' && global.search.type !== null) {
    const { results, total_pages, page, total_results } = await searchAPIData()
    global.search.totalPages = total_pages
    global.search.page = page
    global.search.totalResults = total_results

    if (results.length === 0) {
      showAlert('No results found')
    }

    displaySearchResults(results)

    document.querySelector('#search-term').value = ''
  } else {
    showAlert('Please provide proper search term')
  }
}

// Display Search Results
function displaySearchResults(results) {
  document.querySelector('#search-results-heading').innerHTML = ''
  document.querySelector('#search-results').innerHTML = ''
  document.querySelector('#pagination').innerHTML = ''

  results.forEach((movie) => {
    const {
      poster_path,
      title = movie.name,
      id,
      release_date = movie.first_air_date,
    } = movie
    const card = document.createElement('div')
    card.classList.add('card')
    card.innerHTML = `
    <a href="${global.search.type}-details.html?id=${id}">
    <img src="${
      poster_path ? `${baseImageUrl}${poster_path}` : 'images/no-image.jpg'
    } " class="card-img-top" alt="${title}" />
    </a>
    <div class="card-body">
    <h5 class="card-title">${title}</h5>
    <p class="card-text">
    <small class="text-muted">Release: ${release_date}</small>
    </p>
    </div>
    
    `
    document.querySelector('#search-results-heading').innerHTML = `
    <h2>${results.length} of ${global.search.totalResults} results found for '${global.search.term}'</h2>
    `

    document.querySelector('#search-results').appendChild(card)
  })

  displayPagination()
}

// Display Pagination
function displayPagination() {
  const pagination = document.querySelector('#pagination')
  const div = document.createElement('div')
  div.classList.add('pagination')

  div.innerHTML = `
    <button class="btn btn-primary" id="prev">Prev</button>
    <button class="btn btn-primary" id="next">Next</button>
    <div class="page-counter">Page ${global.search.page} of ${global.search.totalPages}</div>
   `
  pagination.appendChild(div)

  // Disable prev button
  if (global.search.page === 1) {
    document.querySelector('#prev').disabled = true
  }

  // Disable next button
  if (global.search.page === global.search.totalPages) {
    document.querySelector('#next').disabled = true
  }

  // Next Page
  document.querySelector('#next').addEventListener('click', async () => {
    global.search.page++
    const { results } = await searchAPIData()
    displaySearchResults(results)
  })

  // Prev Page
  document.querySelector('#prev').addEventListener('click', async () => {
    global.search.page--
    const { results } = await searchAPIData()
    displaySearchResults(results)
  })
}

// Display SLider Movies
async function displaySLider() {
  const entpoint = 'movie/now_playing'
  const url = `${global.api.apiUrl}${entpoint}`

  const { results } = await fetchData(url, options)
  results.forEach((movie) => {
    const { poster_path, title, id } = movie

    const fullPosterUrl = `${baseImageUrl}${poster_path}` // Construct full image URL

    const div = document.createElement('div')
    div.classList.add('swiper-slide')

    div.innerHTML = `
        <a href="movie-details.html?id=${id}">
          <img src="${fullPosterUrl}" alt="${title}" />
        </a>
        <h4 class="swiper-rating">
          <i class="fas fa-star text-secondary"></i> ${Math.round(
            movie.vote_average
          )} / 10
        </h4>
  `

    document.querySelector('.swiper-wrapper').appendChild(div)

    initSwiper()
  })
}

// Initialize Swiper
function initSwiper() {
  //swiper library
  const swiper = new Swiper('.swiper', {
    // eslint-disable-line
    slidesPerView: 1,
    spaceBetween: 30,
    freeMode: true,
    loop: true,
    autoplay: {
      delay: 4000,
      disableOnInteraction: false,
    },
    breakpoints: {
      500: {
        slidesPerView: 2,
      },
      768: {
        slidesPerView: 3,
      },
      1200: {
        slidesPerView: 5,
      },
    },
  })
}

// Render movies
async function renderMovies(movies) {
  movies.forEach((movie) => {
    const { poster_path, title, release_date, id } = movie
    const fullPosterUrl = `${baseImageUrl}${poster_path}` // Construct full image URL

    const popularMovies = document.querySelector('#popular-movies')
    const oneMovie = `
      <div class="card" id="${id}">
        <a href="movie-details.html?id=${id}">
          <img
            src="${fullPosterUrl}"
            class="card-img-top"
            alt="${title}"
          />
        </a>
        <div class="card-body">
          <h5 class="card-title">${title}</h5>
          <p class="card-text">
            <small class="text-muted">Release: ${release_date}</small>
          </p>
        </div>
      </div>
    `
    popularMovies.innerHTML += oneMovie
  })
}

// Render Movie Details
function renderMovieDetails(movie) {
  const movieDetails = document.querySelector('#movie-details')
  const {
    poster_path,
    title,
    overview,
    release_date,
    vote_average,
    homepage,
    budget,
    revenue,
    runtime,
    status,
    genres,
    production_companies,
  } = movie

  const fullPosterUrl = `${baseImageUrl}${poster_path}` // Construct full image URL;
  function loopGenres(genres) {
    let genreList = ''
    genres.forEach((genre) => {
      genreList += `<li>${genre.name}</li>`
    })
    return genreList
  }
  function productionCompanies(companies) {
    let companyList = ''
    companies.forEach((company) => {
      companyList += `  <div class="list-group">${company.name} </div>`
    })
    return companyList
  }

  movieDetails.innerHTML = `
   <div class="details-top">
          <div>
            <img
              src="${poster_path ? fullPosterUrl : 'images/no-image.jpg'}"
              class="card-img-top"
              alt="${title}"
            />
          </div>
          <div>
            <h2>${title}</h2>
            <p>
           <i class="fas fa-star text-primary"></i>
           ${Math.round(vote_average)} /10 
            </p>
            <p class="text-muted">Release Date: ${release_date}</p>
            <p>
              ${overview ? overview : 'No overview available'}
            </p>
            <h5>Genres</h5>
            <ul class="list-group">
              ${loopGenres(genres)}
            </ul>
            <a href="${homepage}" target="_blank" class="btn">Visit Movie Homepage</a>
          </div>
        </div>
        <div class="details-bottom">
          <h2>Movie Info</h2>
          <ul>
            <li><span class="text-secondary">Budget:</span> $ ${budget.toLocaleString()}</li>

            <li><span class="text-secondary">Revenue:</span> $ ${revenue.toLocaleString()}</li>
            <li><span class="text-secondary">Runtime:</span> ${runtime} minutes</li>
            <li><span class="text-secondary">Status:</span> ${status}</li>
          </ul>
          <h4>Production Companies</h4>
          ${productionCompanies(production_companies)}
        
        </div>
  
  `
}

// Get Movie Details
async function getDetailMovie() {
  const queryString = window.location.search
  const id = queryString.split('=')[1]
  const lang = localStorage.getItem('lang')

  const languageCode = languages[lang]
  const fallbackLanguage = 'en-Us'

  async function fetchData(lang) {
    const entpoint = `movie/${id}`
    const url = `${global.api.apiUrl}${entpoint}?language=${
      lang ? lang : languageCode
    }`

    try {
      const response = await fetch(url, options)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.log(error)
    }
  }
  let data = await fetchData()

  if (!data.overview) {
    console.log(
      `No overview in ${languageCode}, fetching in fallback language (${fallbackLanguage})...`
    )
    data = await fetchData(fallbackLanguage)
  }
  renderMovieDetails(data)
  fetchData()
}

// Highlight active link based on the link name
function highlightActiveLink(linkName) {
  const links = document.querySelectorAll('.nav-link')
  links.forEach((link) => {
    if (link.innerText === linkName) {
      link.classList.add('active')
    } else {
      link.classList.remove('active') // Clear active class from other links
    }
  })
}

// Show Alert
function showAlert(message, className = 'error') {
  const alertEl = document.createElement('div')
  alertEl.classList.add('alert', className)
  alertEl.innerText = message

  document.getElementById('alert').appendChild(alertEl)
  setTimeout(() => {
    alertEl.classList.remove(className)
    alertEl.innerText = ''
  }, 4000)
}

// Get Popular Tv Shows
function getTvShows() {
  const lang = localStorage.getItem('lang')

  const languageCode = languages[lang]
  const entpoint = 'tv/popular'
  const url = `${global.api.apiUrl}${entpoint}?language=${languageCode}`

  async function fetchData() {
    try {
      const response = await fetch(url, options)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      renderTvShows(data.results)
    } catch (error) {
      console.log(error)
    }
  }
  fetchData()
}

// Render Popular Tv Shows
function renderTvShows(data) {
  data.forEach((movie) => {
    const { poster_path, name, first_air_date, id } = movie
    const populatTvShows = document.getElementById('popular-shows')
    const oneMovie = `
    <div class="card">
      <a href="tv-details.html?id=${id}">
      <img src="${
        poster_path ? `${baseImageUrl}${poster_path}` : 'images/no-image.jpg'
      }"
      class="card-img-top"
      alt="${name || 'images/no-image.jpg'}"/>
      </a>
      <div class="card-body">
      <h5 class="card-title">${name}</h5>
      <p class="card-text">
          <small class="text-muted">Aired: ${first_air_date}</small>
      </p>
      </div>
    </div>
`
    populatTvShows.innerHTML += oneMovie
  })
}

// Get Details TV Show
async function getDetailsTVShow() {
  const idTvShow = window.location.search.split('=')[1]
  const lang = localStorage.getItem('lang')
  const languageCode = languages[lang]
  const fallbackLanguage = 'en-US'

  const entpoint = `tv/${idTvShow}`
  async function fetchData(lang) {
    const url = `${global.api.apiUrl}${entpoint}?language=${
      lang ? lang : languageCode
    }`
    try {
      const response = await fetch(url, options)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.log(error)
    }
  }

  let data = await fetchData(languageCode)

  // If the overview is missing or empty, fetch again with fallback language
  if (!data.overview) {
    console.log(
      `No overview in ${languageCode}, fetching in fallback language (${fallbackLanguage})...`
    )
    data = await fetchData(fallbackLanguage)
  }

  renderDetailsTVShow(data)
}

// Render Details TV Show
function renderDetailsTVShow(data) {
  const {
    name,
    overview,
    first_air_date,
    last_episode_to_air,
    status,
    genres,
    poster_path,
    vote_average,
    homepage,
    production_companies,
    episode_run_time,
  } = data

  const showDetails = document.getElementById('show-details')
  const details = `
     <div class="details-top">
          <div>
            <img
              src="${baseImageUrl}${poster_path}"
              class="card-img-top"
              alt="${name || 'images/no-image.jpg'}"
            />
          </div>
          <div>
            <h2>${name}</h2>
            <p>
              <i class="fas fa-star text-primary"></i>
              ${Math.round(vote_average)} / 10
            </p>
            <p class="text-muted">Release Date: ${first_air_date}</p>
            <p>
             ${
               overview ? overview : 'No available translation in this language'
             }
            </p>
            <h5>Genres</h5>
            <ul class="list-group">
             ${genres.map((genre) => `<li>${genre.name}</li>`).join(' ')}
            </ul>
            <a href="${homepage}" target="_blank" class="btn">Visit Show Homepage</a>
          </div>
        </div>
        <div class="details-bottom">
          <h2>Show Info</h2>
          <ul>
            <li><span class="text-secondary">Number Of Episodes:</span> ${
              episode_run_time[0] || 'N/A'
            }</li>
            <li>
              <span class="text-secondary">Last Episode To Air:</span> ${
                last_episode_to_air.air_date || 'N/A'
              }
            </li>
            <li><span class="text-secondary">Status:</span> ${status}</li>
          </ul>
          <h4>Production Companies</h4>
          <div class="list-group">${production_companies
            .map((companies) => `<p>${companies.name}</p>`)
            .join(' ')}</div>
        </div>

  `
  showDetails.innerHTML += details
}

// Initialize the app
function init() {
  switch (global.currentPage) {
    case '/':
    case '/index.html':
      displaySLider()
    case '/movie-details.html':
      highlightActiveLink('Movies')
      if (global.currentPage === '/' || global.currentPage === '/index.html') {
        getLanguage()
      } else if (global.currentPage === '/movie-details.html') {
        getDetailMovie()
      }
      break
    case '/shows.html':
    case '/tv-details.html':
      highlightActiveLink('TV Shows')
      if (global.currentPage === '/shows.html') {
        getTvShows()
      } else {
        getDetailsTVShow()
      }
      break
    case '/search.html':
      search()
      break
    default:
      console.error('Page not found: 404')
  }
}

// Start when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  init()
})
document.addEventListener('click', (e) => {
  if (e.target.matches('[data-lg]')) {
    getLanguage(e)
  }
})
