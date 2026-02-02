import os
import logging
from dotenv import load_dotenv
load_dotenv()
from groq import Groq
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load API Key from environment or use the hardcoded one (prefer environment in production)
# Keeping the user's key for now as per their snippet, but typically this should be an env var.
API_KEY = os.getenv("GROQ_API_KEY")

if not API_KEY:
    raise RuntimeError("GROQ_API_KEY not set")
 
client = Groq(api_key=API_KEY)
logger.info("Successfully initialized the Groq client")

def get_response(question, image_url=None):
    """
    Standard LLM response generator.
    """
    logger.info("Getting response from the LLM")
    
    messages = [
        {
            "role": "system",
            "content": "You are a TB Diagnosis Assistant. Provide helpful, clinical information based on user queries."
        },
        {
            "role": "user",
            "content": [{"type": "text", "text": question}]
        }
    ]
    
    if image_url:
        messages[1]["content"].append({
            "type": "image_url",
            "image_url": {"url": image_url}
        })

    try:
        chat_completion = client.chat.completions.create(
            messages=messages,
            model="llama-3.2-11b-vision-preview", 
            temperature=0.1,
        )
        return chat_completion.choices[0].message.content
    except Exception as e:
        logger.error(f"Error calling LLM: {e}")
        return "AI analysis unavailable. Please refer to clinical guidelines."

def get_clinical_explanation(risk_level, risk_score, findings, symptoms, vitals):
    """
    Generates clinical reasoning for a given risk level and findings.
    Task 2: Use LLM ONLY for explanation.
    """
    prompt = f"""
    You are a clinical decision support system. A patient has been assessed for Tuberculosis.
    
    ASSESSMENT RESULTS:
    - Calculated Risk Level: {risk_level}
    - Numerical Risk Score: {risk_score}/13
    - Key Findings: {', '.join(findings)}
    
    PATIENT DATA:
    - Symptoms: {json.dumps(symptoms)}
    - Vitals: {json.dumps(vitals)}
    
    TASK:
    Generate a 3-4 sentence clinical reasoning summary explaining WHY the patient was classified as {risk_level} risk. 
    Use medical terminology appropriately. 
    Suggest 3 specific next steps based on this {risk_level} risk level.
    
    IMPORTANT: 
    - Do NOT change the risk level. 
    - Do NOT generate a new score.
    - OUTPUT ONLY a JSON object with the following keys: 'reasoning' (string), 'next_steps' (list of strings).
    - If the findings are minimal, explain that the risk is low but monitoring is advised.
    """

    try:
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.1-8b-instant", # Faster model for text-only explanation
            temperature=0.2,
            response_format={"type": "json_object"}
        )

        content = chat_completion.choices[0].message.content
        logger.info(f"LLM Explanation: {content}")
        return json.loads(content)

    except Exception as e:
        logger.error(f"Error getting clinical explanation: {e}")
        # Robust fallback
        fallback_reasoning = f"The patient exhibits {risk_level.lower()} risk based on a clinical score of {risk_score}/13. "
        if findings:
            fallback_reasoning += f"Key factors include: {', '.join(findings)}."
        else:
            fallback_reasoning += "No major TB indicators were identified."
            
        return {
            "reasoning": fallback_reasoning,
            "next_steps": [
                "Monitor symptoms for 2 weeks",
                "Follow up if cough persists",
                "Maintain respiratory hygiene"
            ] if risk_level == "Low" else [
                "Order Sputum AFB test",
                "Refer to pulmonologist",
                "Initiate chest X-ray if not done"
            ]
        }


