import json

def calculate_risk(symptoms_data, vitals_data, has_xray, ai_suggested_risk=None):
    """
    Deterministic rule-based TB risk assessment.
    Returns:
        - risk_score (int)
        - risk_level (str)
        - confidence_score (float)
        - breakdown (dict)
        - recommendations (list)
    """
    score = 0
    breakdown = {
        "symptoms": [],
        "vitals": [],
        "imaging": [],
        "missing_data": []
    }
    
    # --- 1. Symptom Analysis ---
    # Common TB symptoms and their weights
    # Cough > 2 weeks is a primary indicator
    cough_duration = symptoms_data.get("cough_duration", "")
    if "2 weeks" in str(cough_duration) or "month" in str(cough_duration):
        score += 3
        breakdown["symptoms"].append("Cough duration > 2 weeks (+3)")
    elif str(cough_duration).lower() not in ["none", "no", "0", ""]:
         score += 1
         breakdown["symptoms"].append("Persistent cough (+1)")

    # Specific symptoms
    symptom_list = symptoms_data.get("selected_symptoms", [])
    if isinstance(symptom_list, str): # Handle if it came in as a string
         # rough parsing if needed, but assuming list/dict from frontend
         pass
         
    # Check boolean flags often sent from frontend
    if symptoms_data.get("blood_in_sputum") or "hemoptysis" in str(symptom_list).lower():
        score += 4 # High specific indicator
        breakdown["symptoms"].append("Hemoptysis (Blood in sputum) (+4)")
    
    if symptoms_data.get("night_sweats") or "night sweats" in str(symptom_list).lower():
        score += 2
        breakdown["symptoms"].append("Night sweats (+2)")
        
    if symptoms_data.get("weight_loss") or "weight loss" in str(symptom_list).lower():
        score += 2
        breakdown["symptoms"].append("Unexplained weight loss (+2)")
        
    if symptoms_data.get("fever") or "fever" in str(symptom_list).lower():
        score += 1
        breakdown["symptoms"].append("Persistent fever (+1)")
        
    if symptoms_data.get("chest_pain") or "chest pain" in str(symptom_list).lower():
        score += 1
        breakdown["symptoms"].append("Chest pain (+1)")

    # --- 2. Vitals Analysis ---
    try:
        temp = float(vitals_data.get("temperature", 98.6))
        if temp > 100.4:
            score += 2
            breakdown["vitals"].append(f"High Fever ({temp}°F) (+2)")
        elif temp > 99.0:
            score += 1
            breakdown["vitals"].append(f"Low-grade Fever ({temp}°F) (+1)")
            
        spo2 = float(vitals_data.get("spo2", 98))
        if spo2 < 90:
            score += 3
            breakdown["vitals"].append(f"Critical Hypoxia (SpO2 {spo2}%) (+3)")
        elif spo2 < 95:
             score += 1
             breakdown["vitals"].append(f"Low Oxygen Saturation ({spo2}%) (+1)")
    except ValueError:
        breakdown["missing_data"].append("Invalid Vitals Format")

    # --- 3. Imaging Analysis (determinants) ---
    # Since we can't deterministically analyze the image pixel-by-pixel without a model,
    # we rely on the FACT that an image was uploaded as a "check" step.
    # In a real system, a classifier output would go here. 
    # For now, if an X-ray is present, we flag it for high-priority manual review 
    # OR if the user 'checked' an abnormal box (if that existed).
    # We will treat the presence of an X-ray as "Evidence provided" which slightly boosts confidence,
    # but the SCORE itself depends on AI extraction or manual input. 
    # IF the AI ran successfully and found abnormalities, we can incorporate that safely 
    # if it aligns with our deterministic checks, but the prompt asked for separate logic.
    
    # For this "Defensible" system, we assume:
    # If standard AI analysis fails, we rely purely on clinical features.
    # We add a placeholder: "Imaging Available for Review"
    if has_xray:
        breakdown["imaging"].append("Chest X-Ray uploaded (Available for review)")
    else:
        breakdown["missing_data"].append("No Chest X-Ray provided")

    # --- 4. Risk Categorization ---
    # Thresholds
    if score >= 8:
        risk_level = "High"
    elif score >= 4:
        risk_level = "Medium"
    else:
        risk_level = "Low"

    # --- 5. Confidence Score ---
    # Based on completeness of data
    data_points = 0
    total_expected = 3 # Symptoms, Vitals, Imaging
    
    if breakdown["symptoms"]: data_points += 1
    if breakdown["vitals"]: data_points += 1
    if has_xray: data_points += 1
    
    confidence_score = data_points / total_expected
    if confidence_score > 0.9: confidence_score = 0.95 # Cap at 95% for "human verification needed"

    # --- 6. Recommendations ---
    recommendations = []
    
    if risk_level == "High":
        recommendations.append("Immediate Isolation: Patient shows strong clinical signs of active TB.")
        recommendations.append("Confirm validity: Order CBNAAT (GeneXpert) / Sputum Smear Microscopy immediately.")
        recommendations.append("Chest X-Ray review by radiologist required." if has_xray else "Order Chest X-Ray immediately.")
        recommendations.append("Start contact tracing for family members.")
    elif risk_level == "Medium":
        recommendations.append("Clinical Correlation recommended: Symptoms suggest possible TB or respiratory infection.")
        recommendations.append("Order Sputum Acid-Fast Bacilli (AFB) test.")
        recommendations.append("Prescribe broad-spectrum antibiotics and review in 7 days.")
        recommendations.append("Monitor temperature and weight daily.")
    else:
        recommendations.append("Symptomatic treatment for cough/fever.")
        recommendations.append("Follow up if symptoms persist > 1 week.")
        recommendations.append("Counsel on respiratory hygiene.")

    return {
        "risk_score": score,
        "risk_level": risk_level,
        "confidence_score": confidence_score,
        "breakdown": breakdown,
        "recommendations": recommendations
    }
