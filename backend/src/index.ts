import { createApp } from './app';
import { env } from './config/env';

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`API rodando em http://localhost:${env.PORT}`);
  console.log(
    env.GOOGLE_MAPS_API_KEY
      ? 'Google Maps API Key configurada.'
      : 'Atenção: GOOGLE_MAPS_API_KEY não configurada no .env.',
  );
});