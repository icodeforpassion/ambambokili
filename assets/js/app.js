const CONFIG = {
  CHANNEL_NAME: "Ambambo Kili",
  CHANNEL_TAGLINE: "Malayalam kids songs, stories, and Kerala cartoons",
  CHANNEL_URL: "https://www.youtube.com/@AmbamboKili",
  PLAYLIST_URL: "https://www.youtube.com/playlist?list=RDXqZsoesa55w",
  SITE_URL: "https://icodeforpassion.github.io/ambambokili",
  CONTACT_EMAIL: "hello@ambambokili.example",
  DEFAULT_THUMB: "/ambambokili/assets/img/placeholder.jpg"
};

const AppState = {
  videos: [],
  categories: new Map()
};

document.addEventListener("DOMContentLoaded", () => {
  setupNavToggle();
  setFooterYear();
  loadVideos().then(() => {
    const page = document.body.dataset.page;
    switch (page) {
      case "home":
        renderHome();
        break;
      case "videos":
        renderVideosPage();
        break;
      case "categories":
        if (document.body.dataset.slug) {
          renderCategoryPage(document.body.dataset.slug);
        } else {
          renderCategoriesIndex();
        }
        break;
      case "video":
        renderVideoPage(document.body.dataset.slug);
        break;
      default:
        break;
    }
  });
});

async function loadVideos() {
  if (AppState.videos.length) return AppState.videos;
  try {
    const response = await fetch("/ambambokili/data/videos.json");
    if (!response.ok) throw new Error("Failed to load videos.json");
    const data = await response.json();
    AppState.videos = data.sort((a, b) => new Date(b.published) - new Date(a.published));
    buildCategoryMap();
    return AppState.videos;
  } catch (error) {
    console.error(error);
    displayError("We could not load the video library right now. Please refresh the page.");
    return [];
  }
}

function buildCategoryMap() {
  AppState.categories.clear();
  for (const video of AppState.videos) {
    for (const category of video.categories) {
      if (!AppState.categories.has(category)) {
        AppState.categories.set(category, []);
      }
      AppState.categories.get(category).push(video);
    }
  }
}

function setupNavToggle() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".site-nav");
  if (!toggle || !nav) return;
  toggle.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!expanded));
    nav.classList.toggle("open");
  });
}

function setFooterYear() {
  const el = document.getElementById("footer-year");
  if (el) {
    el.textContent = new Date().getFullYear();
  }
}

function renderHome() {
  renderLatestVideos();
  renderPopularCategories();
  injectHomeJsonLd();
}

function renderLatestVideos() {
  const container = document.querySelector("[data-grid='latest']");
  if (!container) return;
  const latest = AppState.videos.slice(0, 8);
  container.innerHTML = latest.map(videoCard).join("");
}

function renderPopularCategories() {
  const container = document.getElementById("popular-categories-grid");
  if (!container) return;
  const sorted = Array.from(AppState.categories.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 6);
  container.innerHTML = sorted
    .map(([category, videos]) => {
      const slug = slugify(category);
      return `
        <article class="category-card">
          <img src="${videos[0]?.thumb_url || CONFIG.DEFAULT_THUMB}" alt="${category} category" loading="lazy">
          <h3>${category}</h3>
          <p>${videos.length} videos</p>
          <a class="btn primary" href="/ambambokili/categories/${slug}/">Explore ${category}</a>
        </article>`;
    })
    .join("");
}

function renderVideosPage() {
  const searchInput = document.getElementById("video-search");
  const chipsContainer = document.getElementById("category-chips");
  const listContainer = document.getElementById("videos-list");
  const prevBtn = document.getElementById("prev-page");
  const nextBtn = document.getElementById("next-page");
  const statusEl = document.getElementById("pagination-status");
  if (!searchInput || !chipsContainer || !listContainer) return;

  const state = {
    search: "",
    category: null,
    page: 1,
    perPage: 12
  };

  function applyFilters() {
    let filtered = [...AppState.videos];
    if (state.search) {
      const term = state.search.toLowerCase();
      filtered = filtered.filter(video =>
        video.title.toLowerCase().includes(term) ||
        video.tags.some(tag => tag.toLowerCase().includes(term))
      );
    }
    if (state.category) {
      filtered = filtered.filter(video => video.categories.includes(state.category));
    }
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / state.perPage));
    state.page = Math.min(state.page, totalPages);
    const start = (state.page - 1) * state.perPage;
    const pageItems = filtered.slice(start, start + state.perPage);
    listContainer.innerHTML = pageItems.map(videoCard).join("");
    statusEl.textContent = `Page ${state.page} of ${totalPages}`;
    prevBtn.disabled = state.page <= 1;
    nextBtn.disabled = state.page >= totalPages;
    listContainer.dataset.count = total;
  }

  searchInput.addEventListener("input", event => {
    state.search = event.target.value.trim();
    state.page = 1;
    applyFilters();
  });

  function createChip(category) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chip";
    button.textContent = category;
    button.setAttribute("role", "option");
    button.addEventListener("click", () => {
      state.category = state.category === category ? null : category;
      state.page = 1;
      for (const child of chipsContainer.children) {
        child.setAttribute("aria-selected", child.textContent === state.category ? "true" : "false");
      }
      applyFilters();
    });
    return button;
  }

  const sortedCategories = Array.from(AppState.categories.keys()).sort();
  sortedCategories.forEach(category => {
    const chip = createChip(category);
    chip.setAttribute("aria-selected", "false");
    chipsContainer.appendChild(chip);
  });

  prevBtn?.addEventListener("click", () => {
    if (state.page > 1) {
      state.page -= 1;
      applyFilters();
    }
  });

  nextBtn?.addEventListener("click", () => {
    const total = Number(listContainer.dataset.count || AppState.videos.length);
    const totalPages = Math.max(1, Math.ceil(total / state.perPage));
    if (state.page < totalPages) {
      state.page += 1;
      applyFilters();
    }
  });

  applyFilters();
}

function renderCategoriesIndex() {
  const container = document.getElementById("category-list");
  if (!container) return;
  const entries = Array.from(AppState.categories.entries()).sort((a, b) => b[1].length - a[1].length);
  container.innerHTML = entries
    .map(([category, videos]) => {
      const slug = slugify(category);
      return `
        <article class="category-card">
          <img src="${videos[0]?.thumb_url || CONFIG.DEFAULT_THUMB}" alt="${category} Malayalam kids songs" loading="lazy">
          <h3>${category}</h3>
          <p>${videos.length} joyful videos</p>
          <a class="btn primary" href="/ambambokili/categories/${slug}/">Open ${category}</a>
        </article>`;
    })
    .join("");
}

function renderCategoryPage(slug) {
  const categoryName = Array.from(AppState.categories.keys()).find(cat => slugify(cat) === slug);
  if (!categoryName) {
    displayError("Category not found.");
    return;
  }
  const videos = AppState.categories.get(categoryName) || [];
  const main = document.getElementById("main-content");
  if (!main) return;
  const intro = document.createElement("section");
  intro.className = "category-page-intro";
  intro.innerHTML = `
    <h1>${categoryName} Malayalam Kids Songs</h1>
    <p>${categoryIntroText(categoryName)}</p>
  `;
  const grid = document.createElement("div");
  grid.className = "video-grid";
  grid.innerHTML = videos.map(videoCard).join("");
  main.innerHTML = "";
  main.appendChild(intro);
  main.appendChild(grid);
  updateMetaTags({
    title: `${categoryName} Malayalam Kids Songs – Ambambo Kili`,
    description: `Enjoy ${videos.length} ${categoryName.toLowerCase()} themed Malayalam kids songs and cartoons from Ambambo Kili.`,
    canonical: `${CONFIG.SITE_URL}/categories/${slug}/`
  });
}

function categoryIntroText(category) {
  return `Sing, dance, and imagine with our ${category.toLowerCase()} collection. These Malayalam kids videos blend Kerala rhythms, stories, and bright characters to make family screen time meaningful.`;
}

function renderVideoPage(slug) {
  const video = AppState.videos.find(item => item.slug === slug);
  if (!video) {
    displayError("Video not found.");
    return;
  }
  const main = document.getElementById("main-content");
  if (!main) return;
  const breadcrumbs = `
    <nav class="breadcrumbs" aria-label="Breadcrumb">
      <a href="/ambambokili/">Home</a> › <a href="/ambambokili/videos/">Videos</a> › ${video.title}
    </nav>`;
  const categories = video.categories
    .map(category => `<a href="/ambambokili/categories/${slugify(category)}/">${category}</a>`)
    .join(", ");
  const playlistButtons = (video.playlist_urls || [])
    .map(url => `<a class="btn" href="${url}">Open playlist</a>`)
    .join("");
  const related = findRelatedVideos(video, 3);
  const moreLinks = findRelatedVideos(video, 4, video.slug, true);

  main.innerHTML = `
    ${breadcrumbs}
    <article>
      <header>
        <h1>${video.title}</h1>
        <div class="video-meta">
          <time datetime="${video.published}">Published ${formatDate(video.published)}</time>
          <span>Duration: ${formatDuration(video.duration)}</span>
          <span>Categories: ${categories}</span>
        </div>
      </header>
      <div class="video-player">
        <div class="embed">
          <iframe src="https://www.youtube.com/embed/${video.yt_id}" title="${video.title}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>
        </div>
      </div>
      <section class="video-description">
        <p>${video.description_long}</p>
      </section>
      ${renderLyricsSection(video.lyrics)}
      <section>
        <h2>Educational value</h2>
        <ul class="educational-list">
          ${generateEducationalPoints(video).map(point => `<li>${point}</li>`).join("")}
        </ul>
      </section>
      <div class="video-actions">
        <a class="btn primary" href="https://www.youtube.com/watch?v=${video.yt_id}">Watch on YouTube</a>
        ${playlistButtons}
      </div>
      <div class="backlink-block">
        <p>Watch this Malayalam kids song on YouTube: <a href="https://www.youtube.com/watch?v=${video.yt_id}">https://www.youtube.com/watch?v=${video.yt_id}</a></p>
        <p>Subscribe to Ambambo Kili on YouTube: <a href="${CONFIG.CHANNEL_URL}">${CONFIG.CHANNEL_URL}</a></p>
      </div>
      <section>
        <h2>Related videos</h2>
        <div class="related-grid">
          ${related.map(videoCard).join("")}
        </div>
      </section>
      <section>
        <h2>More from Ambambo Kili</h2>
        <div class="more-links">
          ${moreLinks.map(item => `<a href="/ambambokili/videos/${item.slug}/">Discover the ${item.title} video story</a>`).join("")}
        </div>
      </section>
    </article>
  `;

  updateMetaTags({
    title: `${video.title} – Ambambo Kili`,
    description: `${video.description_short}`.slice(0, 157),
    canonical: `${CONFIG.SITE_URL}/videos/${video.slug}/`,
    image: video.thumb_url,
    ogType: "video.other"
  });
  injectVideoJsonLd(video);
  injectBacklinks(video);
}

function injectBacklinks(video) {
  const meta = document.createElement("meta");
  meta.name = "robots";
  meta.content = "index, follow";
  document.head.appendChild(meta);
}

function findRelatedVideos(video, count, excludeSlug = video.slug, uniquePool = false) {
  const pool = AppState.videos.filter(item => item.slug !== excludeSlug && item.slug !== video.slug);
  const related = pool
    .filter(item => item.categories.some(cat => video.categories.includes(cat)))
    .slice(0, count);
  if (related.length < count && uniquePool) {
    const extras = pool.filter(item => !related.includes(item)).slice(0, count - related.length);
    related.push(...extras);
  }
  if (!uniquePool && related.length < count) {
    const extras = pool.filter(item => !related.includes(item)).slice(0, count - related.length);
    related.push(...extras);
  }
  return related;
}

function updateMetaTags({ title, description, canonical, image, ogType = "website" }) {
  if (title) document.title = title;
  setOrCreateMeta("name", "description", description);
  setOrCreateLink("canonical", canonical);
  setOrCreateMeta("property", "og:title", title);
  setOrCreateMeta("property", "og:description", description);
  setOrCreateMeta("property", "og:type", ogType);
  setOrCreateMeta("property", "og:url", canonical);
  setOrCreateMeta("property", "og:image", image || `${CONFIG.SITE_URL}${CONFIG.DEFAULT_THUMB}`);
  setOrCreateMeta("name", "twitter:title", title);
  setOrCreateMeta("name", "twitter:description", description);
  setOrCreateMeta("name", "twitter:card", ogType === "video.other" ? "player" : "summary_large_image");
  setOrCreateMeta("name", "twitter:image", image || `${CONFIG.SITE_URL}${CONFIG.DEFAULT_THUMB}`);
}

function setOrCreateMeta(attr, name, value) {
  if (!name || !value) return;
  let meta = document.head.querySelector(`meta[${attr}='${name}']`);
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute(attr, name);
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", value);
}

function setOrCreateLink(rel, href) {
  if (!href) return;
  let link = document.head.querySelector(`link[rel='${rel}']`);
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", rel);
    document.head.appendChild(link);
  }
  link.setAttribute("href", href);
}

function videoCard(video) {
  return `
    <article class="video-card">
      <a href="/ambambokili/videos/${video.slug}/">
        <img src="${video.thumb_url || CONFIG.DEFAULT_THUMB}" alt="${video.title}" loading="lazy">
        <h3>${video.title}</h3>
      </a>
      <div class="meta">
        <time datetime="${video.published}">${formatDate(video.published)}</time>
        <span> · ${formatDuration(video.duration)}</span>
      </div>
      <p>${video.description_short}</p>
      <a class="btn" href="/ambambokili/videos/${video.slug}/">Open video page</a>
    </article>`;
}

function formatDate(dateString) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(dateString));
}

function formatDuration(isoDuration) {
  const match = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(isoDuration);
  if (!match) return "";
  const hours = match[1] ? `${match[1]}h ` : "";
  const minutes = match[2] ? `${match[2]}m ` : "";
  const seconds = match[3] ? `${match[3]}s` : "";
  return `${hours}${minutes}${seconds}`.trim();
}

function generateEducationalPoints(video) {
  const items = new Set();
  video.tags.slice(0, 4).forEach(tag => items.add(`Encourages learning about ${tag.toLowerCase()}.`));
  video.categories.forEach(category => items.add(`Celebrates ${category.toLowerCase()} themes with Malayalam vocabulary.`));
  return Array.from(items).slice(0, 6);
}

function renderLyricsSection(lyrics) {
  if (!Array.isArray(lyrics) || !lyrics.length) {
    return "";
  }
  const stanzas = lyrics
    .map(stanza => `<p>${stanza.split("\n").map(line => escapeHtml(line)).join("<br>")}</p>`)
    .join("");
  return `
      <section class="video-lyrics">
        <h2>Lyrics</h2>
        <div class="lyrics-text">${stanzas}</div>
      </section>`;
}

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function escapeHtml(str = "") {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function injectHomeJsonLd() {
  const ld = document.getElementById("ld-home");
  if (!ld) return;
  const json = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": CONFIG.CHANNEL_NAME,
    "url": CONFIG.SITE_URL,
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${CONFIG.SITE_URL}/videos/?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };
  ld.textContent = JSON.stringify(json, null, 2);
}

function injectVideoJsonLd(video) {
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "name": video.title,
    "description": video.description_short,
    "thumbnailUrl": [video.thumb_url],
    "uploadDate": video.published,
    "duration": video.duration,
    "embedUrl": `https://www.youtube.com/embed/${video.yt_id}`,
    "url": `${CONFIG.SITE_URL}/videos/${video.slug}/`,
    "publisher": {
      "@type": "Organization",
      "name": CONFIG.CHANNEL_NAME,
      "url": CONFIG.CHANNEL_URL,
      "logo": {
        "@type": "ImageObject",
        "url": `${CONFIG.SITE_URL}${CONFIG.DEFAULT_THUMB}`
      }
    }
  }, null, 2);
  document.head.appendChild(script);
}

function displayError(message) {
  const main = document.getElementById("main-content");
  if (main) {
    main.innerHTML = `<p role="alert">${message}</p>`;
  }
}
