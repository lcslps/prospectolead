import { Router } from 'express';
import { City, State } from 'country-state-city';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validate';
import { locationCitiesQuerySchema, locationStatesQuerySchema } from '../schemas';
import { ok, validatedQuery } from '../utils/respond';

export const locationRouter = Router();

locationRouter.get(
  '/states',
  validate(locationStatesQuerySchema),
  asyncHandler(async (req, res) => {
    const { country } = validatedQuery<{ country: string }>(req);
    const states = State.getStatesOfCountry(country).map((state) => ({
      code: state.isoCode,
      name: state.name,
    }));
    ok(res, { states });
  }),
);

locationRouter.get(
  '/cities',
  validate(locationCitiesQuerySchema),
  asyncHandler(async (req, res) => {
    const { country, state } = validatedQuery<{ country: string; state: string }>(req);
    const cities = [...new Set(City.getCitiesOfState(country, state).map((city) => city.name))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    ok(res, { cities });
  }),
);