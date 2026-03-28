import time
import threading
from google import genai
from config import GEMINI_API_KEY

client = genai.Client(api_key=GEMINI_API_KEY)


class RateLimiter:
    """Track API calls and enforce cooldowns to avoid burning credits."""

    def __init__(self, max_calls_per_minute: int = 10, budget_limit: float = 3.0):
        self._lock = threading.Lock()
        self._calls: list[float] = []
        self._max_per_minute = max_calls_per_minute
        self._total_calls = 0
        self._budget_limit = budget_limit
        self._estimated_spent = 0.0

    # Rough cost estimates per call (USD) — conservative, overestimates
    COST_PER_CALL = {
        "gemini-3-flash-preview": 0.01,
        "gemini-3.1-flash-image-preview": 0.05,
        "lyria-3-clip-preview": 0.10,
        "veo-3.1-fast-generate-preview": 0.50,
    }

    MODEL_NAMES = {
        "gemini-3-flash-preview": "Flash",
        "gemini-3.1-flash-image-preview": "Nano Banana",
        "lyria-3-clip-preview": "Lyria",
        "veo-3.1-fast-generate-preview": "Veo",
    }

    def check(self, model: str) -> None:
        """Call before every API request. Logs cost, blocks if rate limit hit, raises if budget exceeded."""
        with self._lock:
            est_cost = self.COST_PER_CALL.get(model, 0.05)
            name = self.MODEL_NAMES.get(model, model)

            # Budget check
            if self._estimated_spent + est_cost > self._budget_limit:
                raise RuntimeError(
                    f"BUDGET LIMIT: Estimated spend ${self._estimated_spent:.2f} + "
                    f"${est_cost:.2f} would exceed ${self._budget_limit:.2f} limit. "
                    f"Total calls so far: {self._total_calls}"
                )

            # Rate limit — sliding window
            now = time.time()
            self._calls = [t for t in self._calls if now - t < 60]
            if len(self._calls) >= self._max_per_minute:
                wait = 60 - (now - self._calls[0])
                print(f"[Rate limit] {len(self._calls)} calls in last minute. Waiting {wait:.0f}s...")
                time.sleep(wait)

            self._calls.append(time.time())
            self._total_calls += 1
            self._estimated_spent += est_cost

            print(f"[API] {name} — est. ${est_cost:.2f} | Session total: ${self._estimated_spent:.2f} / ${self._budget_limit:.2f} ({self._total_calls} calls)")

    def status(self) -> str:
        return (
            f"Calls: {self._total_calls} | "
            f"Est. spent: ${self._estimated_spent:.2f} / ${self._budget_limit:.2f}"
        )


rate_limiter = RateLimiter()


if __name__ == "__main__":
    rate_limiter.check("gemini-3-flash-preview")
    response = client.models.generate_content(
        model="gemini-3-flash-preview",
        contents="Say hello in one word",
    )
    print(f"Client OK: {response.text}")
    print(rate_limiter.status())
