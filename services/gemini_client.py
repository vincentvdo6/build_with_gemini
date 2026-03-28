from google import genai
from config import GEMINI_API_KEY

client = genai.Client(api_key=GEMINI_API_KEY)


if __name__ == "__main__":
    response = client.models.generate_content(
        model="gemini-3-flash-preview",
        contents="Say hello in one word",
    )
    print(f"Client OK: {response.text}")
