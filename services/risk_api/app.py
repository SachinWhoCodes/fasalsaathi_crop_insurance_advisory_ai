import json
import requests
import os 
from flask import Flask, request, jsonify
from flask_cors import CORS

API_KEY = os.environ.get("GEMINI_API_KEY")

app = Flask(__name__)
CORS(app)


def calculate_risk(ideal, forecasted):
    if ideal == 0 and forecasted == 0:
        return 0.0
    if ideal == 0:
        return 1.0
    deviation = abs(ideal - forecasted) / ideal
    return min(deviation, 1.0)


def interpret_risk(score, is_stage=False):
    if is_stage:
        if score < 0.15: return "Low"
        if score < 0.30: return "Moderate"
        if score < 0.50: return "High"
        return "Very High"
    else:
        if score < 1.5: return "Low"
        if score < 3.0: return "Moderate"
        if score < 5.0: return "High"
        return "Very High"


def generate_description(risk_data):
    if not API_KEY:
        return "Description could not be generated: API Key not configured."
        
    try:
        
        crop = risk_data['crop']
        district = risk_data['district']
        overall_level = risk_data['overall_risk']['level']
        
        stage_risks = sorted(risk_data['stage_wise_risk'], key=lambda x: x['score'], reverse=True)
        top_stages_info = [f"'{stage['name']}' ({stage['level']} risk)" for stage in stage_risks[:2]]

        system_prompt = "You are an agricultural expert providing clear, concise advice to farmers. Your tone should be helpful and direct."
        user_prompt = (
            f"I have an analysis for a {crop} crop in {district}. "
            f"The overall risk is '{overall_level}'. The most critical stages are {', '.join(top_stages_info)}. "
            f"Please provide a short, 2-3 sentence summary explaining this risk to a farmer. "
            f"Focus on what the overall risk means and which stages need the most attention."
        )

        api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key={API_KEY}"

        payload = {
            "contents": [{"parts": [{"text": user_prompt}]}],
            "systemInstruction": {"parts": [{"text": system_prompt}]}
        }

        response = requests.post(api_url, json=payload, headers={'Content-Type': 'application/json'})
        response.raise_for_status() 
        
        result = response.json()
        
        description = result.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')
        
        return description.strip() if description else "Could not generate a summary."

    except requests.exceptions.HTTPError as e:
        return f"Description could not be generated due to API error (Status {e.response.status_code}): {e.response.text}"
    except requests.exceptions.RequestException as e:
        return f"Description could not be generated due to a network error: {e}"
    except Exception as e:
        return f"Description could not be generated due to an unexpected error: {e}"


def analyze_crop_risk(data):
    total_risk_score = 0
    stage_risks_list = []
    parameter_weights = {
        'tmin_c': 0.2, 'tmax_c': 0.2, 'rh_pct': 0.2, 'rain_mm': 0.2, 'wind_kmph': 0.2
    }

    for stage in data['stages']:
        stage_name = stage['name']
        ideal = stage['ideal']
        forecasted = stage['forecasted']
        importance = stage['importance_weight']

        tmin_risk = calculate_risk(ideal['tmin_c'], forecasted['tmin_c'])
        tmax_risk = calculate_risk(ideal['tmax_c'], forecasted['tmax_c'])
        rh_risk = calculate_risk(ideal['rh_pct'], forecasted['rh_pct'])
        rain_risk = calculate_risk(ideal['rain_mm'], forecasted['rain_mm'])
        wind_risk = calculate_risk(ideal['wind_kmph'], forecasted['wind_kmph'])

        stage_parameter_risk = (
            tmin_risk * parameter_weights['tmin_c'] +
            tmax_risk * parameter_weights['tmax_c'] +
            rh_risk * parameter_weights['rh_pct'] +
            rain_risk * parameter_weights['rain_mm'] +
            wind_risk * parameter_weights['wind_kmph']
        )
        
        final_stage_risk = stage_parameter_risk * importance
        risk_level = interpret_risk(final_stage_risk, is_stage=True)
        
        stage_risks_list.append({
            'name': stage_name,
            'score': round(final_stage_risk, 2),
            'level': risk_level
        })
        total_risk_score += final_stage_risk

    overall_risk_level = interpret_risk(total_risk_score)
    
    risk_result = {
        "crop": data.get('crop', 'N/A'),
        "district": data.get('district', 'N/A'),
        "stage_wise_risk": stage_risks_list,
        "overall_risk": {
            "score": round(total_risk_score, 2),
            "level": overall_risk_level
        }
    }
    return risk_result


@app.route("/calculate-risk", methods=['POST'])
def handle_risk_calculation():
    if not request.json:
        return jsonify({"error": "Invalid request: No JSON data provided"}), 400

    try:
        risk_analysis_data = analyze_crop_risk(request.json)
        human_description = generate_description(risk_analysis_data)
        risk_analysis_data['description'] = human_description
        return jsonify(risk_analysis_data)
        
    except KeyError as e:
        return jsonify({"error": f"Missing key in input data: {e}"}), 400
    except Exception as e:
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500


if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5002, debug=True)
