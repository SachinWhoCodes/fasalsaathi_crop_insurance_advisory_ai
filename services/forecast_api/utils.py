import os
import requests
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

API_KEYS = {
    "visualcrossing": os.getenv("VISUAL_CROSSING_API_KEY"),
    "weatherapi": os.getenv("WEATHERAPI_API_KEY"),
}

def _iso(d):
    """Ensure YYYY-MM-DD string."""
    if isinstance(d, str):
        return datetime.fromisoformat(d).date().isoformat()
    return d.isoformat()

def _mean(vals):
    vals = [v for v in vals if v is not None]
    return round(sum(vals) / len(vals), 2) if vals else None

def _normalize_vc_day(d):
    # Visual Crossing (metric)
    # tempmin/tempmax (°C), humidity (%), precip (mm), windspeed (km/h), solarradiation (W/m²)
    solar = d.get("solarradiation")
    if solar is None:
        # If solarradiation is absent, try solarenergy (kWh/m²) → avg W/m² over 24h
        se = d.get("solarenergy")
        if se is not None:
            solar = (se * 1000.0) / 24.0
    return {
        "date": d.get("datetime"),
        "tmin_c": d.get("tempmin"),
        "tmax_c": d.get("tempmax"),
        "rh_pct": d.get("humidity"),
        "rain_mm": d.get("precip"),
        "wind_kmph": d.get("windspeed"),
        "solar_wm2": solar,
    }

def _normalize_wa_day(d):
    # WeatherAPI (forecastday element)
    day = d.get("day", {})
    return {
        "date": d.get("date"),
        "tmin_c": day.get("mintemp_c"),
        "tmax_c": day.get("maxtemp_c"),
        "rh_pct": day.get("avghumidity"),
        "rain_mm": day.get("totalprecip_mm"),
        "wind_kmph": day.get("maxwind_kph"),
        # uv is not in W/m²; keep solar None to avoid mixing scales
        "solar_wm2": None,
    }

def fetch_visualcrossing_series(location_str, start_date, days=120):
    start = datetime.fromisoformat(start_date).date()
    end = start + timedelta(days=days - 1)
    url = (
        "https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/"
        f"{location_str}/{start}/{end}?unitGroup=metric&key={API_KEYS['visualcrossing']}&include=days"
    )
    r = requests.get(url, timeout=30)
    r.raise_for_status()
    data = r.json()
    return [_normalize_vc_day(d) for d in data.get("days", [])]

def fetch_weatherapi_series(location_str, _start_date, _days=14):
    # WeatherAPI returns next ~14 days from "today"
    url = f"http://api.weatherapi.com/v1/forecast.json?key={API_KEYS['weatherapi']}&q={location_str}&days=14&aqi=no&alerts=no"
    r = requests.get(url, timeout=30)
    r.raise_for_status()
    data = r.json()
    days = data.get("forecast", {}).get("forecastday", [])
    return [_normalize_wa_day(d) for d in days]

def fetch_daily_forecast(location_str, start_date, days=120):
    """
    Returns dict: ISO date -> {tmin_c,tmax_c,rh_pct,rain_mm,wind_kmph,solar_wm2}
    Prefers VisualCrossing; fills missing dates with WeatherAPI when available.
    """
    by_date = {}

    # Try VisualCrossing
    try:
        vc = fetch_visualcrossing_series(location_str, start_date, days=days)
        for d in vc:
            by_date[_iso(d["date"])] = d
    except Exception as e:
        print(f"[VC] Error: {e}")

    # Fill gaps with WeatherAPI (~14 days window from now)
    try:
        wa = fetch_weatherapi_series(location_str, start_date)
        for d in wa:
            iso = _iso(d["date"])
            if iso not in by_date:
                by_date[iso] = d
    except Exception as e:
        print(f"[WA] Error: {e}")

    return by_date

def average_stage_window(daily_map, start_date, duration_days):
    """
    Slice daily_map from start_date for duration_days and average available fields.
    Returns (averages_dict, covered_count)
    """
    start = datetime.fromisoformat(start_date).date()
    dates = [(start + timedelta(days=i)).isoformat() for i in range(duration_days)]
    tmin, tmax, rh, rain, wind, solar = [], [], [], [], [], []

    for iso in dates:
        d = daily_map.get(iso)
        if not d:
            continue
        tmin.append(d.get("tmin_c"))
        tmax.append(d.get("tmax_c"))
        rh.append(d.get("rh_pct"))
        rain.append(d.get("rain_mm"))
        wind.append(d.get("wind_kmph"))
        solar.append(d.get("solar_wm2"))

    averages = {
        "tmin_c": _mean(tmin),
        "tmax_c": _mean(tmax),
        "rh_pct": _mean(rh),
        "rain_mm": _mean(rain),
        "wind_kmph": _mean(wind),
        "solar_wm2": _mean(solar),
    }
    covered = sum(x is not None for x in [*tmin, *tmax, *rh, *rain, *wind, *solar])
    return averages, covered

def fill_forecast_for_payload(payload: dict):
    """
    Returns a new payload with each stage['forecasted'] filled using forecast averages.
    Adds a 'window' {start, end, days} for each stage.
    """
    # Shallow copy
    payload = dict(payload)
    district = (payload.get("district") or "").strip()
    state = (payload.get("state") or "").strip()
    sw_date = payload.get("sw_date")
    if not sw_date:
        raise ValueError("sw_date is required in payload")

    # Prefer "district, state" if present
    location = ", ".join([p for p in [district, state] if p]) or state or district
    if not location:
        # If both missing, try region/crop as a fallback search hint (rough)
        location = (payload.get("region") or "India").strip()

    # Fetch a 120-day forecast map keyed by date
    daily_map = fetch_daily_forecast(location, sw_date, days=120)

    # Walk stages
    stages = payload.get("stages", [])
    cursor_date = datetime.fromisoformat(sw_date).date()
    new_stages = []

    for stage in stages:
        duration = int(stage.get("duration_days", 0) or 0)
        averages, _ = average_stage_window(daily_map, cursor_date.isoformat(), duration)

        st_copy = dict(stage)
        st_copy["forecasted"] = {k: v for k, v in averages.items() if v is not None}
        st_copy["window"] = {
            "start": cursor_date.isoformat(),
            "end": (cursor_date + timedelta(days=max(duration - 1, 0))).isoformat(),
            "days": duration,
        }

        new_stages.append(st_copy)
        cursor_date = cursor_date + timedelta(days=duration)

    payload["stages"] = new_stages
    return payload