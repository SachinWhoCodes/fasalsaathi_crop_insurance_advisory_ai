from flask import Flask, request, jsonify
from flask_cors import CORS
from utils import fill_forecast_for_payload, fetch_daily_forecast

app = Flask(__name__)
# Open CORS for all origins; tighten for production if needed
CORS(app, resources={r"/*": {"origins": "*"}})

@app.get("/health")
def health():
    return {"status": "ok", "service": "FasalSaathi Forecast API"}

@app.post("/fill-forecast")
def fill_forecast():
    """
    Accepts the stage JSON, fills each stage['forecasted'] with averaged values
    from the sowing date across each stage window, and returns the updated payload.
    """
    try:
        payload = request.get_json(force=True, silent=False)
        if not payload:
            return jsonify({"error": "JSON body required"}), 400
        updated = fill_forecast_for_payload(payload)
        return jsonify(updated), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Optional legacy shim similar to an earlier design (returns per-day map)
@app.post("/get-weather")
def get_weather():
    try:
        data = request.get_json(force=True, silent=False)
        city = data.get("city")
        date = data.get("date")
        if not city or not date:
            return jsonify({"error": "City and date are required"}), 400
        by_date = fetch_daily_forecast(city, date, days=120)
        return jsonify({"city": city, "start_date": date, "days": len(by_date), "data": by_date})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    # For Postman/local use
    app.run(host="0.0.0.0", port=5000, debug=True)