# actions/actions.py
import os
import json
import logging
from typing import Any, Dict, List, Text

import requests
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import SlotSet, EventType

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Endpoints / timeouts
PLANNER_URL        = os.getenv("PLANNER_URL", "https://planner.shivshaktifabrichouse.com/predict")
FORECAST_URL       = os.getenv("FORECAST_URL", "https://forecast.shivshaktifabrichouse.com/fill-forecast")
RISK_URL           = os.getenv("RISK_URL", "https://risk.shivshaktifabrichouse.com/calculate-risk")
RAW_DATA_ENDPOINT  = os.getenv("RAW_DATA_ENDPOINT", "https://angelia-swirlier-incommunicably.ngrok-free.dev/api/data/set-raw-data")

PLANNER_TIMEOUT  = int(os.getenv("PLANNER_TIMEOUT", "15"))
FORECAST_TIMEOUT = int(os.getenv("FORECAST_TIMEOUT", "20"))
RISK_TIMEOUT     = int(os.getenv("RISK_TIMEOUT", "20"))
SAVE_TIMEOUT     = int(os.getenv("SAVE_TIMEOUT_SECS", "15"))

REQUIRED_INPUT_SLOTS = ["crop", "seed_type", "soil", "district", "season", "state", "sw_date"]


# 1) Planner (unchanged)
class ActionCallCropPlanner(Action):
    def name(self) -> Text:
        return "action_call_crop_planner"

    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict[Text, Any]) -> List[EventType]:
        missing = [s for s in REQUIRED_INPUT_SLOTS if not tracker.get_slot(s)]
        if missing:
            dispatcher.utter_message(text=f"Some details are missing: {', '.join(missing)}")
            return []

        payload = {
            "crop": tracker.get_slot("crop"),
            "seed_type": tracker.get_slot("seed_type"),
            "soil": tracker.get_slot("soil"),
            "district": tracker.get_slot("district"),
            "season": tracker.get_slot("season"),
            "state": tracker.get_slot("state"),
            "sw_date": tracker.get_slot("sw_date"),
        }

        try:
            logger.info("Calling planner API with payload:\n%s", json.dumps(payload, indent=2))
            resp = requests.post(PLANNER_URL, json=payload, timeout=PLANNER_TIMEOUT)
            resp.raise_for_status()
            data = resp.json()

            logger.info("Planner API response:\n%s", json.dumps(data, indent=2))
            dispatcher.utter_message(
                text="I've fetched your crop plan. (Full JSON attached)",
                json_message={"stage": "ideals", "planner_response": data},
            )
            return [SlotSet("planner_response", data)]

        except requests.RequestException as e:
            logger.exception("Planner API error: %s", e)
            dispatcher.utter_message(text="The planner service is not reachable right now. Please try again.")
            return []
        except Exception as e:
            logger.exception("Unexpected error: %s", e)
            dispatcher.utter_message(text="Something went wrong while getting your plan.")
            return []


# 2) Forecast (uses planner_response)
class ActionCallForecast(Action):
    def name(self) -> Text:
        return "action_call_forecast"

    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict[Text, Any]) -> List[EventType]:
        planner_json = tracker.get_slot("planner_response")
        if not planner_json:
            dispatcher.utter_message(text="I don’t have the base plan yet. Please run the planner first.")
            return []

        try:
            logger.info("Calling forecast API (%s)…", FORECAST_URL)
            res = requests.post(FORECAST_URL, json=planner_json, timeout=FORECAST_TIMEOUT)
            res.raise_for_status()
            forecast_json = res.json()

            logger.info("Forecast response:\n%s", json.dumps(forecast_json, indent=2))
            dispatcher.utter_message(
                text="(forecast) Added the latest forecast to your plan.",
                json_message={"stage": "forecast", "forecast_response": forecast_json},
            )
            # store under both names for convenience
            return [
                SlotSet("forecast_response", forecast_json),
                SlotSet("forecasted_file", forecast_json),
            ]

        except requests.RequestException as e:
            logger.exception("Forecast API error: %s", e)
            dispatcher.utter_message(text="Forecast service isn’t reachable right now.")
            return []
        except Exception as e:
            logger.exception("Unexpected error in forecast: %s", e)
            dispatcher.utter_message(text="Something went wrong while getting the forecast.")
            return []


# 3) Risk (uses forecast_response)
class ActionCallRisk(Action):
    def name(self) -> Text:
        return "action_call_risk"

    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict[Text, Any]) -> List[EventType]:
        forecast_json = tracker.get_slot("forecast_response") or tracker.get_slot("forecasted_file")
        if not forecast_json:
            dispatcher.utter_message(text="I don’t have the forecasted plan yet. Please run the forecast step first.")
            return []

        try:
            logger.info("Calling risk API (%s)…", RISK_URL)
            res = requests.post(RISK_URL, json=forecast_json, timeout=RISK_TIMEOUT)
            res.raise_for_status()
            risk_json = res.json()

            logger.info("Risk response:\n%s", json.dumps(risk_json, indent=2))
            dispatcher.utter_message(
                text="(risk) Computed stage-wise risk and overall risk.",
                json_message={"stage": "risk", "risk_response": risk_json},
            )
            # keep a single “final” snapshot too, if you like
            return [
                SlotSet("risk_response", risk_json),
                SlotSet("final_report", risk_json),
            ]

        except requests.RequestException as e:
            logger.exception("Risk API error: %s", e)
            dispatcher.utter_message(text="Risk service isn’t reachable right now.")
            return []
        except Exception as e:
            logger.exception("Unexpected error in risk: %s", e)
            dispatcher.utter_message(text="Something went wrong while computing risk.")
            return []


# 4) Store FINAL data (prefer risk → forecast → planner)
class ActionStoreFinalData(Action):
    def name(self) -> Text:
        return "action_store_final_data"

    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict[Text, Any]) -> List[EventType]:
        user_id = tracker.get_slot("user_id") or tracker.sender_id
        final_json = (
            tracker.get_slot("risk_response")
            or tracker.get_slot("final_report")
            or tracker.get_slot("forecast_response")
            or tracker.get_slot("planner_response")
        )

        if not final_json:
            dispatcher.utter_message(text="I don’t have any plan data to save yet.")
            return []
        if not user_id:
            dispatcher.utter_message(text="I need your user ID to save your report.")
            return []

        payload = {"userid": str(user_id), "report": final_json}

        try:
            logger.info("Saving FINAL JSON to %s for user_id=%s", RAW_DATA_ENDPOINT, user_id)
            res = requests.post(RAW_DATA_ENDPOINT, json=payload, timeout=SAVE_TIMEOUT)
            res.raise_for_status()
            try:
                out = res.json()
            except ValueError:
                out = {"status": "ok", "raw_text": res.text}

            logger.info("Store response:\n%s", json.dumps(out, indent=2))

            report_key = out.get("key") or (out.get("data") or {}).get("key") or out.get("report_id")
            events: List[EventType] = [SlotSet("storage_response", out)]
            if report_key:
                events += [SlotSet("report_key", report_key), SlotSet("report_id", report_key)]

            dispatcher.utter_message(
                text="✅ Saved your final report.",
                json_message={"stage": "indexed", "storage_response": out},
            )
            return events

        except requests.RequestException as e:
            logger.exception("Store API error: %s", e)
            dispatcher.utter_message(text="I couldn’t save your report right now. Please try again.")
            return []
        except Exception as e:
            logger.exception("Unexpected error while saving final data: %s", e)
            dispatcher.utter_message(text="Something went wrong while saving your report.")
            return []
