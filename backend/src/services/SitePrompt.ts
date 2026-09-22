import type { ArtefactFiles, BusinessData, DesignPlan, SiteAsset } from './siteArtefactSchema';
import type { SocialProfiles } from './LeadSocialService';
import type { ReviewEntry } from './SiteImages';
import { codemakersSkills, codemakersSystemMethod, professionalSkills, relevantSkills, siteRepairPrompt, siteSystemPrompt } from './PromptLibrary';
import type { AssetManifest, BusinessAnalysis, CreativeBrief } from './WebsiteStrategy';
import { strategyPromptBlock } from './WebsiteStrategy';
import type { ArtDirectionPlan } from './ArtDirection';
import { artDirectionPromptBlock } from './ArtDirection';

export const SYSTEM_INSTRUCTION = `${siteSystemPrompt()}\n\n${codemakersSystemMethod()}`;
export const REPAIR_SYSTEM_INSTRUCTION = siteRepairPrompt();

const FACT_BOUNDARY = `FACTUAL BOUNDARY:
- Only the verified data below may be stated as fact.
- Never invent services, products, prices, years in business, customers, staff, awards, certifications, opening hours, payment methods, delivery, statistics or testimonials.
- Persuasive copy is welcome, but it cannot introduce a factual claim absent from the context.
- Omit sections whose content would require missing facts.`;

const OUTPUT_CONTRACT = `OUTPUT CONTRACT:
- Return JSON only, matching the response schema.
- index.html is a complete pt-BR semantic document linked to styles.css and script.js.
- Use exactly one h1, semantic landmarks, useful link labels and working mobile navigation.
- Define a coherent token system in :root and use fluid typography with clamp().
- Include content-driven breakpoints for 375px, 768px and 1280px behavior.
- Implement visible :focus-visible and prefers-reduced-motion.
- Use no external scripts, frameworks, unsafe protocols, base tag or data URLs.
- The combined site must stay under 250 KB.
- Every image must use a supplied {{ASSET_TOKEN}} or declared {{INTENT_id}}. Never type an image URL.
- A premium site must contain at least one real visual in the hero or first major section. If no supplied asset fits, declare a specific hero imageIntent and render it as <img src="{{INTENT_id}}">. Never render an empty image div, a gradient-only image placeholder, or data-intent-id placeholders.
- Each imageIntent must express the image direction in structured fields: subject, camera/framing, lighting, composition, negative space, palette, things to avoid, and orientation. The intent must be a precise English visual query that matches those fields.`;

function verifiedFacts(business: BusinessData, notes?: string): string {
  const entries: Array<[string, string | undefined]> = [
    ['Name', business.name], ['Category', business.category || business.categories.join(', ')],
    ['City/state', [business.city, business.state].filter(Boolean).join(' - ')], ['Country', business.country],
    ['Address', business.address], ['Phone', business.phone], ['WhatsApp', business.whatsapp],
    ['Official website', business.website], ['Google rating', business.rating], ['Google review count', business.reviewCount],
    ['Google Maps', business.mapUrl], ['Opening hours', business.hours], ['Verified CRM notes', notes],
  ];
  return entries.filter(([, value]) => value?.trim()).map(([key, value]) => `- ${key}: ${value}`).join('\n') || '- No structured facts available.';
}

function socialFacts(profiles: SocialProfiles): string {
  return [profiles.instagram ? `- Instagram: ${profiles.instagram}` : '', profiles.facebook ? `- Facebook: ${profiles.facebook}` : '']
    .filter(Boolean).join('\n') || '- No verified social profiles.';
}

function assetList(assets: SiteAsset[]): string {
  if (!assets.length) return '- No resolved assets. Declare imageIntents for essential illustrative images.';
  return assets.map(asset => `- {{${asset.id}}}: provider=${asset.provider}; source=${asset.sourceType}; realBusinessAsset=${Boolean(asset.isBusinessAsset)}; kind=${asset.kind || 'unknown'}; intendedUse=${asset.usage || 'support'}; alt=${asset.alt || 'not supplied'}`).join('\n');
}

function reviewList(business: BusinessData, reviews?: ReviewEntry[]): string {
  const rows = (reviews ?? []).filter(review => review.text?.trim()).slice(0, 6);
  const rating = business.rating ? `- Verified aggregate: ${business.rating}${business.reviewCount ? ` from ${business.reviewCount} reviews` : ''}.` : '- No verified aggregate rating.';
  if (!rows.length) return `${rating}\n- No review text is available. Do not create testimonials or customer names.`;
  return `${rating}\n${rows.map(review => `- ${review.author}: ${review.text}${review.rating ? ` (${review.rating}/5)` : ''}${review.when ? `, ${review.when}` : ''}`).join('\n')}\n- Preserve meaning and attribution. Never create additional reviews.`;
}

function commonBlocks(input: {
  business: BusinessData; assets: SiteAsset[]; profiles: SocialProfiles; notes?: string; summary?: string; reviews?: ReviewEntry[];
  analysis?: BusinessAnalysis; brief?: CreativeBrief; manifest?: AssetManifest; artDirection?: ArtDirectionPlan;
}): string {
  const strategy = input.analysis && input.brief && input.manifest
    ? strategyPromptBlock(input.analysis, input.brief, input.manifest)
    : '';
  const artDirection = input.artDirection ? artDirectionPromptBlock(input.artDirection) : '';
  return `${FACT_BOUNDARY}

SPECIALIST SKILLS:
${professionalSkills()}

CODEMAKERS DESIGN REFERENCES (visual and UX craft only; factual rules above always win):
${codemakersSkills(input.business.category || input.business.categories.join(' '))}

NICHE GUIDANCE:
${relevantSkills(input.business.category || input.business.categories.join(' '))}

${strategy}

${artDirection}

VERIFIED BUSINESS DATA:
${verifiedFacts(input.business, input.notes)}

VERIFIED Google Places SUMMARY:
${input.summary || '- Not available.'}

VERIFIED SOCIAL PROFILES:
${socialFacts(input.profiles)}

AVALIAÇÕES VERIFICADAS / VERIFIED REPUTATION DATA:
${reviewList(input.business, input.reviews)}

RESOLVED ASSETS:
${assetList(input.assets)}

ASSET RULES:
- Real business photos take priority for trust-critical areas when their visual content fits the placement.
- Stock is illustrative. Never call it the storefront, team, work, product or premises of the business.
- Do not repeat a large image unless the composition clearly requires it.
- For missing imagery, declare a specific English imageIntent describing subject, light, framing, orientation and commercial photography style.

${OUTPUT_CONTRACT}`;
}

const responseShape = `{
  "seo": { "title": "max 60 characters", "description": "max 160 characters", "keywords": "comma-separated" },
  "designPlan": {
    "businessInsight": "...", "targetAudience": "...", "creativeDirection": "...",
    "designSystem": {
      "palette": { "primary": "#...", "secondary": "#...", "accent": "#...", "background": "#...", "surface": "#...", "text": "#...", "muted": "#..." },
      "typography": { "family": "...", "display": "...", "headings": "...", "body": "..." },
      "shape": { "radius": "...", "shadow": "...", "border": "..." },
      "spacing": "...", "motion": { "easing": "...", "duration": "...", "reveal": "..." }
    },
    "components": [{ "name": "...", "purpose": "...", "content": "...", "responsive": "..." }],
    "pageFlow": ["..."], "primaryAction": "...", "whatsappStrategy": "...", "contentDecisions": "...", "variationNote": "..."
  },
  "imageIntents": [{
    "id": "short-id", "intent": "specific English visual query",
    "usage": "hero|about|gallery|decor|product", "orientation": "landscape|portrait|square",
    "direction": { "subject": "...", "camera": "...", "lighting": "...", "composition": "...", "negativeSpace": "...", "palette": "...", "avoid": ["..."] }
  }],
  "files": { "index.html": "...", "styles.css": "...", "script.js": "..." }
}`;

export function buildCreatePrompt(input: {
  business: BusinessData; assets: SiteAsset[]; profiles?: SocialProfiles; notes?: string; summary?: string; reviews?: ReviewEntry[];
  analysis?: BusinessAnalysis; brief?: CreativeBrief; manifest?: AssetManifest; artDirection?: ArtDirectionPlan;
}): string {
  return `Create a complete, original, premium website for this business. Execute the approved strategy before implementation. The result must feel designed by an experienced agency, with a distinctive composition, strong typography, intentional imagery and excellent mobile behavior.

${commonBlocks({ ...input, profiles: input.profiles ?? {} })}

Return only this JSON structure:\n${responseShape}`;
}

export function buildRegeneratePrompt(input: {
  business: BusinessData; assets: SiteAsset[]; profiles?: SocialProfiles; summary?: string; reviews?: ReviewEntry[];
  instruction?: string; previousPlan?: DesignPlan; analysis?: BusinessAnalysis; brief?: CreativeBrief; manifest?: AssetManifest; artDirection?: ArtDirectionPlan;
}): string {
  const previous = input.previousPlan
    ? `PREVIOUS DESIGN TO AVOID REPEATING:\n- Direction: ${input.previousPlan.creativeDirection || 'unknown'}\n- Flow: ${input.previousPlan.pageFlow.join(' → ') || 'unknown'}\n- Primary color: ${input.previousPlan.designSystem.palette.primary || 'unknown'}`
    : '';
  return `Regenerate the complete website as a visibly new art direction while preserving verified business facts. Do not make a superficial color variation.

USER DIRECTION:\n${input.instruction || 'Create a clearly different premium composition.'}

${previous}

${commonBlocks({ ...input, profiles: input.profiles ?? {} })}

Return only this JSON structure:\n${responseShape}`;
}

function planSummary(plan?: DesignPlan): string {
  if (!plan) return 'No current design plan.';
  return [
    plan.creativeDirection ? `Direction: ${plan.creativeDirection}` : '',
    plan.primaryAction ? `Primary action: ${plan.primaryAction}` : '',
    plan.pageFlow.length ? `Flow: ${plan.pageFlow.join(' → ')}` : '',
    plan.designSystem.palette.primary ? `Primary: ${plan.designSystem.palette.primary}` : '',
  ].filter(Boolean).join('\n') || 'No current design plan.';
}

export function buildEditPrompt(input: {
  business: BusinessData; instruction: string;
  files: Partial<Pick<ArtefactFiles, 'index.html' | 'styles.css' | 'script.js'>>;
  designPlan?: DesignPlan;
}): string {
  const current = Object.entries(input.files).map(([name, content]) => `--- ${name} ---\n${content}`).join('\n\n');
  return `Edit only what is necessary in the existing website. Preserve verified facts, working behavior, asset URLs and the established design system.

${FACT_BOUNDARY}

BUSINESS: ${input.business.name} · ${input.business.category} · ${input.business.city}/${input.business.state}
CURRENT PLAN:\n${planSummary(input.designPlan)}
USER REQUEST:\n${input.instruction}

CURRENT FILES:\n${current}

Return JSON only: { "files": { "index.html"?: "...", "styles.css"?: "...", "script.js"?: "..." }, "seo"?: { "title": "...", "description": "...", "keywords": "..." } }`;
}

export function buildRepairPrompt(input: {
  business: BusinessData; files: ArtefactFiles; issues: Array<{ code: string; message: string; recommendation?: string }>;
  artDirection?: ArtDirectionPlan; assets?: SiteAsset[];
}): string {
  const current = Object.entries(input.files).map(([name, content]) => `--- ${name} ---\n${content}`).join('\n\n');
  return `Repair the audited website without changing verified facts or replacing its creative direction. Make the smallest coherent changes that resolve every listed issue.

BUSINESS: ${input.business.name} · ${input.business.category} · ${input.business.city}/${input.business.state}
AUDIT ISSUES:\n${input.issues.map(issue => `- [${issue.code}] ${issue.message}${issue.recommendation ? ` Fix: ${issue.recommendation}` : ''}`).join('\n')}

${input.artDirection ? artDirectionPromptBlock(input.artDirection) : ''}

${input.assets?.length ? `RESOLVED ASSETS (do not invent URLs):\n${assetList(input.assets)}` : ''}

CURRENT FILES:\n${current}

Return JSON only with changed files: { "files": { "index.html"?: "...", "styles.css"?: "...", "script.js"?: "..." } }`;
}
