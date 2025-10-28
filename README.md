# Ambambo Kili Static Site

This repository hosts a static website for the Ambambo Kili Malayalam kids channel. The site is built with plain HTML, CSS, and JavaScript so it can be deployed directly to GitHub Pages.

## Features

- Dynamic rendering of videos and categories from a single [`data/videos.json`](data/videos.json) file
- Individual landing pages for every video and category with SEO metadata, Open Graph, and JSON-LD
- Client-side search, category filters, and pagination on the videos listing page
- RSS feed, XML sitemap, and robots.txt for strong discoverability
- Accessibility helpers including skip links, focus styles, and semantic landmarks

## Local preview

You can preview the site locally with any static file server. For example:

```bash
python -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000) in your browser.

## Deploying to GitHub Pages

1. Push this repository to GitHub.
2. In the repository settings, enable GitHub Pages from the `main` branch (or the branch of your choice) and select the `/ (root)` folder.
3. Optionally edit the `CNAME` file with your custom domain before enabling Pages.
4. GitHub Pages will publish the site at `https://<username>.github.io/<repo>/` or at your custom domain.

Any updates to `data/videos.json` automatically cascade to all pages on the next page load.
