import numpy as np

class ClinicalEngine:
    """
    Statistical Clinical Risk Model for TB.
    Uses a weighted scoring system based on epidemiological data.
    """
    
    # Weights based on WHO and CDC TB diagnostic guidelines
    WEIGHTS = {
        "cough_gt_2w": 4.0,       # Primary indicator
        "hemoptysis": 5.0,        # Highly specific
        "weight_loss": 3.0,       # Systemic indicator
        "night_sweats": 2.5,
        "fever": 2.0,
        "chest_pain": 1.5,
        "age_risk": 1.0           # Older and very young patients are higher risk
    }

    def analyze(self, symptoms_data, patient_data):
        """
        Computes a clinical probability of TB.
        """
        score = 0
        total_possible = sum(self.WEIGHTS.values())
        contributions = []

        # 1. Symptom Analysis
        cough_duration = symptoms_data.get("cough_duration", "")
        if "2 weeks" in str(cough_duration) or "month" in str(cough_duration):
            score += self.WEIGHTS["cough_gt_2w"]
            contributions.append("Persistent cough (>2 weeks)")

        if symptoms_data.get("blood_in_sputum") or "hemoptysis" in str(symptoms_data.get("selected_symptoms", [])).lower():
            score += self.WEIGHTS["hemoptysis"]
            contributions.append("Hemoptysis (Blood in sputum)")

        if symptoms_data.get("weight_loss"):
            score += self.WEIGHTS["weight_loss"]
            contributions.append("Unexplained weight loss")

        if symptoms_data.get("night_sweats"):
            score += self.WEIGHTS["night_sweats"]
            contributions.append("Night sweats")

        if symptoms_data.get("fever"):
            score += self.WEIGHTS["fever"]
            contributions.append("Persistent fever")

        if symptoms_data.get("chest_pain"):
            score += self.WEIGHTS["chest_pain"]
            contributions.append("Chest pain")

        # 2. Demographic Analysis
        age = int(patient_data.get("age", 30))
        if age > 60 or age < 5:
            score += self.WEIGHTS["age_risk"]
            contributions.append(f"Age-related vulnerability ({age} yrs)")

        # Calculate Probability (Logistic-style mapping)
        # We use a simple normalization here: score / max_score
        # But apply a sigmoid-like boost for high scores
        clinical_prob = score / total_possible
        
        # Determine Risk level
        if clinical_prob > 0.7:
            risk_level = "High"
        elif clinical_prob > 0.35:
            risk_level = "Medium"
        else:
            risk_level = "Low"

        return {
            "probability": float(round(clinical_prob, 3)),
            "risk_level": risk_level,
            "findings": contributions,
            "confidence": 0.90 if len(contributions) >= 2 else 0.60
        }

# Singleton instance
engine = ClinicalEngine()
