/** Server-only HQ weather location — never expose API key client-side */
export function getHQWeatherLocation(): string {
  return (
    process.env.HQ_WEATHER_LOCATION?.trim() ||
    process.env.HQ_WEATHER_CITY?.trim() ||
    "Pasadena,CA,US"
  );
}
