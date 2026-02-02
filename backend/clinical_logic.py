import json
import logging

logger = logging.getLogger(__name__)

def calculate_tb_risk(symptoms, vitals, xray_present=False):
    """
    Implements a rule-driven scoring engine for TB diagnosis.
    Based on Task 1 requirements.
    """
    risk_score = 0
    findings = []

    # --- 1. Symptom Scoring (+8 total possible) ---
    
    # Cough duration > 2 weeks (+2)
    # Handle both string ("2 weeks") and numeric (2) formats
    cough = symptoms.get("cough", False)
    cough_duration = symptoms.get("coughDuration", symptoms.get("cough_duration", 0))
    
    try:
        duration_num = int(cough_duration)
        is_long_duration = duration_num >= 2
    except (ValueError, TypeError):
        is_long_duration = "2 weeks" in str(cough_duration).lower() or "month" in str(cough_duration).lower()

    if cough and is_long_duration:
        risk_score += 2
        findings.append("Persistent cough > 2 weeks (+2)")
    elif cough:
        risk_score += 1
        findings.append("Presence of cough (+1)")

    # Hemoptysis (+3)
    if symptoms.get("hemoptysis") or symptoms.get("blood_in_sputum") or "hemoptysis" in str(symptoms.get("selected_symptoms", [])).lower():
        risk_score += 3
        findings.append("Hemoptysis / Blood in sputum (+3)")

    # Fever (+1)
    if symptoms.get("fever") or "fever" in str(symptoms.get("selected_symptoms", [])).lower():
        risk_score += 1
        findings.append("Fever (+1)")

    # Night Sweats (+1)
    if symptoms.get("nightSweats") or symptoms.get("night_sweats") or "night sweats" in str(symptoms.get("selected_symptoms", [])).lower():
        risk_score += 1
        findings.append("Night sweats (+1)")

    # Weight Loss (+1)
    if symptoms.get("weightLoss") or symptoms.get("weight_loss") or "weight loss" in str(symptoms.get("selected_symptoms", [])).lower():
        risk_score += 1
        findings.append("Unexplained weight loss (+1)")

    # --- 2. Vitals Scoring (+2 total possible) ---
    try:
        # Check both "spo2" and "spO2" and "temp" vs "temperature"
        spo2 = float(vitals.get("spo2", vitals.get("spO2", 98)))
        if spo2 < 94:
            risk_score += 2
            findings.append(f"Low SpO2 ({spo2}%) (+2)")
        
        temp = float(vitals.get("temp", vitals.get("temperature", 98.6)))
        if temp > 100.4:
            # We didn't have a specific rule for temp in the table, but it's a TB indicator. 
            # However, sticking to the provided table for deterministic scoring.
            # If I want to be strictly compliant with the USER'S TABLE:
            pass
    except (ValueError, TypeError):
        pass

    # --- 3. X-Ray Scoring (+3 total possible) ---
    if xray_present:
        risk_score += 3
        findings.append("Abnormal X-ray / X-ray uploaded (+3)")

    # --- 4. Risk Level Determination ---
    # Based on user-provided thresholds
    if risk_score >= 8:
        risk_level = "High"
    elif risk_score >= 4:
        risk_level = "Medium"
    else:
        risk_level = "Low"

    # --- 5. Confidence Calculation ---
    # Formula: min(95, 40 + risk_score * 7)
    confidence = min(95, 40 + risk_score * 7)

    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "confidence": confidence,
        "findings": findings
    }
