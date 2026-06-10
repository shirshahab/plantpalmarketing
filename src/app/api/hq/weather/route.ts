import { NextResponse } from "next/server";
import { getHQWeatherApiPayload, type WeatherMockMode } from "@/lib/hq/hq-weather-service";

const MOCK_MODES = new Set<WeatherMockMode>(["clear", "rain", "wind", "snow", "clouds", "error"]);

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mockParam = searchParams.get("mock");
  const allowMock = process.env.NODE_ENV !== "production";
  const mock =
    allowMock && mockParam && MOCK_MODES.has(mockParam as WeatherMockMode)
      ? (mockParam as WeatherMockMode)
      : null;

  const result = await getHQWeatherApiPayload(mock);

  return NextResponse.json(
    {
      ok: result.ok,
      error: result.error ?? null,
      ...result.weather,
    },
    {
      status: 200,
      headers: { "Cache-Control": "no-store, max-age=0" },
    }
  );
}
