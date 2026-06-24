# pablonora.github.io

Personal site / portfolio for **Pablo Nora** — Senior Software Engineer & Applied AI Engineer.

Hand-built, **framework-free**, 100% static. A WebGL neural-network hero (three.js),
scroll-driven reveals, full SEO + JSON-LD structured data, and an accessibility/performance-first build.

## Stack
- Plain HTML / CSS / vanilla JS — no build step, no dependencies to install
- [three.js](https://threejs.org/) loaded on-demand via CDN + import map (degrades gracefully to a static background if WebGL or the CDN is unavailable, and is skipped entirely under `prefers-reduced-motion`)
- Google Fonts (Space Grotesk + JetBrains Mono), loaded non-render-blocking

## Files
| File | Purpose |
| --- | --- |
| `index.html` | The page + meta tags + JSON-LD `Person` schema |
| `styles.css` | All styling (the "Neural Dark" theme) |
| `neural.js` | three.js neural-network hero (ES module) |
| `main.js` | Scroll reveals, nav state, count-up, mobile menu |
| `assets/` | Favicon, OG image (`.png` + `.svg` source), résumé PDF |
| `robots.txt`, `sitemap.xml`, `site.webmanifest`, `404.html`, `.nojekyll` | SEO / PWA / hosting |

## Deploy (GitHub Pages — user site)
This repo must be named **`pablonora.github.io`** to serve at the domain root.

```bash
# from this folder
git init
git add .
git commit -m "Initial portfolio"
git branch -M main
git remote add origin git@github.com:pablonora/pablonora.github.io.git
git push -u origin main
```

Then on GitHub: **Settings → Pages → Source: `main` branch, `/ (root)`**.
The site goes live at `https://pablonora.github.io/` within a minute or two.

## Local preview
```bash
node .claude/serve.cjs   # http://localhost:4321
```

## TODO before launch
- Confirm the GitHub username/URL (`github.com/pablonora`) used in the contact section and
  JSON-LD `sameAs`.

The transparency dashboard is linked from Selected Work at
`https://pablonora.github.io/transparencia-eleitoral-municipios/`.
