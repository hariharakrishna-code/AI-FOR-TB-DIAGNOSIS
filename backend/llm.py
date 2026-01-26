import os
import logging
from groq import Groq

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
                "You are an AI-Based Tuberculosis (TB) Diagnosis Support System designed for rural healthcare workers. "
                "Your task is to analyze patient symptoms, vital signs, and Chest X-ray images (if provided). "
                "Output a structured assessment including:\n"
                "1. Risk Level (Low/Medium/High)\n"
                "2. Urgency (Routine/Soon/Immediate)\n"
                "3. Confidence Score (0-100%)\n"
                "4. Primary Indicators (Why you think this?)\n"
                "5. Recommended Action (e.g., Refer to District Hospital, Sputum Test, Home Isolation)\n"
                "6. Explanation (Simple language for non-specialists).\n\n"
                "Be conservative and safety-critical. If signs point to TB, lean towards referral."
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
            # Using the user's specified model. 
            # If this fails, consider 'llama-3.2-11b-vision-preview' or 'llama-3.2-90b-vision-preview' for vision tasks.
            model="meta-llama/llama-4-scout-17b-16e-instruct", 
            temperature=0.2, # Lower temperature for more consistent medical advice
        )

        logger.info("Return from the LLM")
        return chat_completion.choices[0].message.content

    except Exception as e:
        logger.error(f"Error calling LLM: {e}")
        return f"Error generating diagnosis: {str(e)}"
