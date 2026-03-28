import os
from dotenv import load_dotenv

load_dotenv()

# API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Models
MODEL_FLASH = "gemini-3-flash-preview"
MODEL_NANO_BANANA = "gemini-3.1-flash-image-preview"
MODEL_VEO = "veo-3.1-fast-generate-preview"
MODEL_LYRIA = "lyria-3-clip-preview"

# Paths
OUTPUT_DIR = "outputs"
