import asyncio
import json
import threading
from collections import defaultdict

from fastapi import APIRouter, Depends, Request
from sse_starlette.sse import EventSourceResponse

from server.auth import get_current_user

router = APIRouter()


class SSEManager:
    """Thread-safe SSE manager. Pipeline threads push events, async SSE endpoint streams them."""

    def __init__(self):
        self._lock = threading.Lock()
        self._queues: dict[str, list[asyncio.Queue]] = defaultdict(list)
        self._loops: dict[int, asyncio.AbstractEventLoop] = {}

    def subscribe(self, campaign_id: str, loop: asyncio.AbstractEventLoop) -> asyncio.Queue:
        queue: asyncio.Queue = asyncio.Queue()
        with self._lock:
            self._queues[campaign_id].append(queue)
            self._loops[id(queue)] = loop
        return queue

    def unsubscribe(self, campaign_id: str, queue: asyncio.Queue) -> None:
        with self._lock:
            queues = self._queues.get(campaign_id, [])
            if queue in queues:
                queues.remove(queue)
            self._loops.pop(id(queue), None)

    def send(self, campaign_id: str, event: str, data: str) -> None:
        """Called from sync pipeline threads — uses call_soon_threadsafe to wake the event loop."""
        with self._lock:
            queues = self._queues.get(campaign_id, [])
            for q in queues:
                loop = self._loops.get(id(q))
                msg = {"event": event, "data": data}
                if loop and loop.is_running():
                    loop.call_soon_threadsafe(q.put_nowait, msg)
                else:
                    try:
                        q.put_nowait(msg)
                    except asyncio.QueueFull:
                        pass


sse_manager = SSEManager()


@router.get("/{campaign_id}/stream")
async def stream(campaign_id: str, user: dict = Depends(get_current_user)):
    loop = asyncio.get_event_loop()
    queue = sse_manager.subscribe(campaign_id, loop)

    async def event_generator():
        try:
            while True:
                try:
                    msg = await asyncio.wait_for(queue.get(), timeout=30.0)
                    yield {"event": msg["event"], "data": msg["data"]}
                    if msg["event"] in ("complete", "error"):
                        break
                except asyncio.TimeoutError:
                    # Keep connection alive — don't exit
                    yield {"event": "ping", "data": "keepalive"}
        finally:
            sse_manager.unsubscribe(campaign_id, queue)

    return EventSourceResponse(event_generator())
