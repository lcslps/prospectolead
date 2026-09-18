import axios, { AxiosInstance } from 'axios';
import { env } from '../config/env';
import { AppError, badRequest } from '../utils/apiError';
import { sleep } from '../utils/format';

const SEARCH_TEXT_URL = 'https://places.googleapis.com/v1/places:searchText';
const PLACE_SUFFIX = '/places/';

export interface GooglePlace {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  addressComponents?: Array<{
    longText: string;
    shortText: string;
    types: string[];
  }>;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  rating?: number;
  userRatingCount?: number;
  businessStatus?: string;
  types?: string[];
  location?: { latitude?: number; longitude?: number };
  photos?: Array<{ name: string; widthPx?: number; heightPx?: number; authorAttributions?: Array<{ displayName?: string; uri?: string }> }>;
}

export interface SearchTextResponse {
  places?: GooglePlace[];
  nextPageToken?: string | null;
}

interface SearchTextParams {
  query: string;
  pageSize?: number;
  pageToken?: string;
  locationBias?: { lat: number; lng: number } | null;
  radiusMeters?: number | null;
}

const SEARCH_FIELDS = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.addressComponents',
  'places.nationalPhoneNumber',
  'places.internationalPhoneNumber',
  'places.websiteUri',
  'places.googleMapsUri',
  'places.rating',
  'places.userRatingCount',
  'places.businessStatus',
  'places.types',
  'places.location',
  'nextPageToken',
];

const DETAIL_FIELDS = [
  'id',
  'displayName',
  'formattedAddress',
  'addressComponents',
  'nationalPhoneNumber',
  'internationalPhoneNumber',
  'websiteUri',
  'googleMapsUri',
  'rating',
  'userRatingCount',
  'businessStatus',
  'types',
  'location',
];

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 500;
const TIMEOUT_MS = 20000;

const RETRYABLE_CODES = new Set([429, 500, 502, 503, 504]);

export class GooglePlacesService {
  private client: AxiosInstance;
  private lastRequestAt = 0;
  private minIntervalMs = 200;

  constructor() {
    this.client = axios.create({
      timeout: TIMEOUT_MS,
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': env.GOOGLE_MAPS_API_KEY,
      },
    });
  }

  private assertConfigured(): void {
    if (!env.GOOGLE_MAPS_API_KEY) {
      throw badRequest(
        'Google Maps API Key não configurada. Adicione GOOGLE_MAPS_API_KEY no .env do backend.',
      );
    }
  }

  private async throttle(): Promise<void> {
    const now = Date.now();
    const wait = this.lastRequestAt + this.minIntervalMs - now;
    if (wait > 0) {
      await sleep(wait);
    }
    this.lastRequestAt = Date.now();
  }

  private async requestWithRetry<T>(fn: () => Promise<{ data: T }>): Promise<T> {
    let attempt = 0;
    for (;;) {
      try {
        await this.throttle();
        const response = await fn();
        return response.data;
      } catch (error) {
        const status =
          axios.isAxiosError(error) && error.response ? error.response.status : undefined;
        const isRetryable = status !== undefined && RETRYABLE_CODES.has(status);
        const isTimeout = axios.isAxiosError(error) && error.code === 'ECONNABORTED';

        if (attempt >= MAX_RETRIES - 1 || (!isRetryable && !isTimeout)) {
          this.throwApiError(error);
        }

        attempt += 1;
        const delay = BASE_DELAY_MS * 2 ** attempt + Math.floor(Math.random() * 400);
        await sleep(delay);
      }
    }
  }

  private throwApiError(error: unknown): never {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status ?? 502;
      const data = error.response?.data as
        | { error?: { message?: string } }
        | { error?: { status?: string } }
        | undefined;

      if (status === 403) {
        throw new AppError(
          502,
          'Google Places API não autorizada. Verifique se a API está habilitada e a chave é válida.',
        );
      }
      if (status === 429) {
        throw new AppError(429, 'Limite da Google Places API atingido. Tente novamente mais tarde.');
      }
      const message =
        (data as { error?: { message?: string } }).error?.message ??
        (data as { error?: { status?: string } }).error?.status ??
        `Erro na Google Places API (HTTP ${status})`;
      throw new AppError(502, message);
    }
    throw new AppError(
      502,
      error instanceof Error ? `Falha na comunicação com a Google Places API: ${error.message}` : 'Falha na comunicação com a Google Places API.',
    );
  }

  async searchText(params: SearchTextParams): Promise<SearchTextResponse> {
    this.assertConfigured();

    const body: Record<string, unknown> = {
      textQuery: params.query,
      pageSize: params.pageSize ?? 20,
    };
    if (params.pageToken) {
      body.pageToken = params.pageToken;
    }
    if (params.locationBias && params.radiusMeters) {
      body.locationBias = {
        circle: {
          center: { latitude: params.locationBias.lat, longitude: params.locationBias.lng },
          radius: params.radiusMeters,
        },
      };
    }

    return this.requestWithRetry(() =>
      this.client.post<SearchTextResponse>(SEARCH_TEXT_URL, body, {
        headers: {
          'X-Goog-FieldMask': SEARCH_FIELDS.join(','),
        },
      }),
    );
  }

  async getPlaceDetails(
    placeId: string,
    requestedFields: string[] = DETAIL_FIELDS,
  ): Promise<GooglePlace> {
    this.assertConfigured();

    const url = `${PLACE_SUFFIX}${placeId}`;
    return this.requestWithRetry(() =>
      this.client.get<GooglePlace>(`https://places.googleapis.com/v1${url}`, {
        headers: {
          'X-Goog-FieldMask': requestedFields.join(','),
        },
      }),
    );
  }

  enrichFieldMask(place: GooglePlace): string[] {
    const fields: string[] = ['id'];
    if (!place.displayName) fields.push('displayName');
    if (!place.formattedAddress) fields.push('formattedAddress');
    if (!place.nationalPhoneNumber) fields.push('nationalPhoneNumber');
    if (!place.internationalPhoneNumber) fields.push('internationalPhoneNumber');
    if (!place.websiteUri) fields.push('websiteUri');
    if (!place.googleMapsUri) fields.push('googleMapsUri');
    if (place.rating === undefined || place.rating === null) fields.push('rating');
    if (place.userRatingCount === undefined || place.userRatingCount === null)
      fields.push('userRatingCount');
    if (!place.businessStatus) fields.push('businessStatus');
    if (!place.location) fields.push('location');
    if (!place.addressComponents) fields.push('addressComponents');
    if (!place.types || place.types.length === 0) fields.push('types');
    return fields;
  }
}

export const googlePlacesService = new GooglePlacesService();
