# Premium website generation

The production flow is a single pipeline owned by `WebsiteService`:

1. `BusinessNormalizer` turns the CRM lead into verified `BusinessData`.
2. `SiteImages` collects Google Places and official social assets.
3. `WebsiteStrategy` builds `WebsiteGenerationContext`, `BusinessAnalysis`, `CreativeBrief` and `AssetManifest`.
4. `SitePrompt` composes versioned specialist skills, verified facts, the brief and the asset allowlist.
5. Gemini returns structured JSON with design plan and standalone files.
6. `SiteImages` resolves image intents through configured providers and rejects model-invented image URLs.
7. `SiteSanitizer` removes unsafe markup and protocols.
8. `SiteQuality` scores structure, responsive behavior, accessibility, visual-system discipline and performance.
9. Critical or very low-scoring output receives a bounded repair pass through the auxiliary model.
10. The validated document is versioned and used by editor, preview and publication.

## Prompt skills

Core skills live in `site-generator/skills` and cover frontend design, typography, images, motion, copywriting, conversion, responsive design, accessibility, local SEO and data integrity. Niche skills add context without replacing the core quality rules.

## Asset policy

The model receives tokens rather than image URLs. Real business assets are preferred, official social assets come next, and licensed stock is supplemental. Image intents are resolved by the backend. After resolution, direct image sources outside the asset manifest are replaced, so an invented model URL cannot reach the stored site.

## Quality and observability

`generationMetrics` stores the configured model, prompt version, durations, retry count, context size, asset counts, vision image count, audit score, issue count and repair passes. Logs never include API keys or authorization headers.

Change the prompt contract by creating a new `WEBSITE_PROMPT_VERSION`. Add or update a specialist rule in its own Markdown file and cover the behavior with a focused test.
