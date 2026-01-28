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
    Generates a response from the LLM based on the text question and optional image.
    For TB Diagnosis, the 'question' usually contains the patient symptoms/vitals summary,
    and 'image_url' contains the X-ray data.
    """
    logger.info("Getting response from the LLM")
    
    messages = [
        {
            "role": "system",
            "content": (
                "You are an AI-Based Tuberculosis (TB) Diagnosis Support System designed for clinical decision support. "
                "Your task is to analyze patient clinical data and optional Chest X-ray images.\n\n"
                "CRITICAL: Output ONLY a valid JSON object. Do NOT include markdown formatting or extra text.\n\n"
                "JSON Schema:\n"
                "{\n"
                "  \"risk_level\": \"Low\" | \"Medium\" | \"High\",\n"
                "  \"confidence_score\": float (0.0 to 1.0),\n"
                "  \"urgency\": \"Routine\" | \"Soon\" | \"Immediate\",\n"
                "  \"analysis\": \"String with a structured 2-3 sentence overview\",\n"
                "  \"clinical_findings\": {\n"
                "    \"symptoms_interpretation\": \"Interpretation of reported symptoms\",\n"
                "    \"vitals_interpretation\": \"Interpretation of vital signs\",\n"
                "    \"imaging_interpretation\": \"Interpretation of Chest X-ray (if provided, else 'Not provided')\",\n"
                "    \"reasoning\": \"Step-by-step clinical reasoning for the assigned risk level\"\n"
                "  },\n"
                "  \"recommendations\": [\n"
                "    \"List of 3-5 specific medical actions or tests\"\n"
                "  ]\n"
                "}"
            )
        }
    ]

    user_content = [{"type": "text", "text": question}]
    
    if image_url:
        user_content.append({
            "type": "image_url",
            "image_url": {"url": image_url}
        })

    messages.append({
        "role": "user",
        "content": user_content
    })

    try:
        chat_completion = client.chat.completions.create(
            messages=messages,
            model="llama-3.2-11b-vision-preview", 
            temperature=0.1, 
            response_format={"type": "json_object"}
        )

        raw_content = chat_completion.choices[0].message.content
        logger.info(f"Raw LLM Response: {raw_content}")
        return raw_content

    except Exception as e:
        logger.error(f"Error calling LLM: {e}")
        # Return a fallback JSON string to prevent crash
        return json.dumps({
            "risk_level": "Medium",
            "confidence_score": 0.5,
            "urgency": "Soon",
            "analysis": "AI fallback activated due to service interruption.",
            "clinical_findings": {
                "symptoms_interpretation": "Requires manual review.",
                "vitals_interpretation": "Requires manual review.",
                "imaging_interpretation": "Not analyzed.",
                "reasoning": "Standard protocol for system downtime."
            },
            "recommendations": ["Consult clinical guidelines manually", "Re-run analysis later"]
        })

