import assert from 'node:assert/strict';
import { test } from 'node:test';
import { env } from '../src/config/env';
import { googlePlacesService } from '../src/services/GooglePlacesService';
import { WebsiteService } from '../src/services/WebsiteService';
import { documentSchema } from '../src/services/websiteSchema';

test('website image attachment prefers actual Google Maps photos and attributes them', async () => {
  const originalNodeEnv = env.NODE_ENV;
  const originalDetails = googlePlacesService.getPlaceDetails;
  const placeId = 'ChIJ12345678901234567890';
  env.NODE_ENV = 'development';
  googlePlacesService.getPlaceDetails = async () => ({
    id: placeId,
    photos: Array.from({ length: 4 }, (_, index) => ({ name: `places/${placeId}/photos/photo-${index}`, authorAttributions: [{ displayName: `Author ${index}`, uri: `https://maps.google.com/author/${index}` }] })),
  });

  try {
    const document = documentSchema.parse({
      name: 'Marmoraria Mundo dos Granitos',
      business: { googlePlaceId: placeId, name: 'Marmoraria Mundo dos Granitos', category: 'Marmoraria', city: 'Sorriso / MT', mapUrl: 'https://maps.google.com/' },
      theme: {},
      sections: [
        { id: 'hero', type: 'hero', content: { title: 'Mármores e granitos' } },
        { id: 'about', type: 'about', content: { title: 'Nossa marmoraria' } },
        { id: 'gallery', type: 'gallery', content: { title: 'Fotos' } },
        { id: 'footer', type: 'footer', content: { title: 'Contato' } },
      ],
    });
    const result = await (new WebsiteService() as any).attachImages(document.business, document, { hero: 'granite slab showroom', about: 'granite workshop', gallery: 'marble slab details' });
    const hero = result.sections.find((section: any) => section.type === 'hero').content;
    const about = result.sections.find((section: any) => section.type === 'about').content;
    const gallery = result.sections.find((section: any) => section.type === 'gallery').content.items;
    assert.equal(hero.image, `google-place://${placeId}/0`);
    assert.equal(hero.imageCredit, 'Author 0');
    assert.equal(about.image, `google-place://${placeId}/1`);
    assert.deepEqual(gallery.map((item: any) => item.image), [`google-place://${placeId}/2`, `google-place://${placeId}/3`]);
  } finally {
    env.NODE_ENV = originalNodeEnv;
    googlePlacesService.getPlaceDetails = originalDetails;
  }
});
