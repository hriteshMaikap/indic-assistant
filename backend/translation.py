from groq import Groq
import os
import dotenv

# Load environment variables from .env file
dotenv.load_dotenv()

# Get API key from environment variables
api_key = os.environ.get("GROQ_API_KEY")
if not api_key:
    raise ValueError("GROQ_API_KEY not found in environment variables")

client = Groq(
    api_key=api_key
)

def translate_to_english(marathi_text):
    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a Marathi to English translator. Convert the given Marathi text to English. Only return the translation, nothing else."
                },
                {
                    "role": "user",
                    "content": marathi_text
                }
            ],
            model="llama-3.3-70b-versatile",
            temperature=0,
            max_completion_tokens=1024,
            top_p=1,
            stream=False
        )
        
        translation = chat_completion.choices[0].message.content.strip()
        return translation
    except Exception as e:
        return f"Translation error: {str(e)}"