class FusionEngine:
    """
    Multimodal Fusion Engine.
    Combines Clinical and Radiology probabilities using a weighted agreement strategy.
    """
    
    def fuse(self, clinical_result, radiology_result=None):
        """
        Combines two independent streams of evidence.
        Handles optional radiology results.
        """
        
        cp = clinical_result.get("probability", 0.0)
        
        # Case A: No Radiology Data
        if radiology_result is None:
            # If no X-ray, we rely 100% on clinical
            final_prob = cp
            final_risk = clinical_result.get("risk_level", "Low")
            explanation = "Diagnosis based purely on clinical assessment (No imaging provided)."
            agreement = 1.0 # Self-agreement
            
            return {
                "final_probability": float(round(final_prob, 3)),
                "final_risk_level": final_risk,
                "agreement_score": 1.0,
                "fusion_explanation": explanation,
                "confidence_level": "Moderate (Clinical Only)"
            }

        # Case B: Both streams available
        rp = radiology_result.get("probability", 0.0)
        
        # We give slightly more weight to Radiology (0.6) as it's more specific for structural changes
        w_clinical = 0.4
        w_rad = 0.6
        
        # Basic weighted fusion
        final_prob = (cp * w_clinical) + (rp * w_rad)
        
        # Calculate Agreement / Conflict
        agreement = 1.0 - abs(cp - rp)
        
        # Explainability of the fusion
        if agreement > 0.8:
            explanation = "High inter-model consensus between clinical symptoms and radiological findings."
        elif agreement < 0.4:
            explanation = "Clinical-Radiological discordance observed. Further investigation (CBNAAT) is critical."
        else:
            explanation = "Combined assessment based on clinical history and imaging correlation."

        # Risk Tiering
        if final_prob > 0.75:
            final_risk = "High"
        elif final_prob > 0.4:
            final_risk = "Medium"
        else:
            final_risk = "Low"

        return {
            "final_probability": float(round(final_prob, 3)),
            "final_risk_level": final_risk,
            "agreement_score": float(round(agreement, 3)),
            "fusion_explanation": explanation,
            "confidence_level": "High" if agreement > 0.7 else "Moderate"
        }

# Singleton instance
engine = FusionEngine()
