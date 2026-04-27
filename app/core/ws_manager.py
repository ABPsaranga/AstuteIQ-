# app/core/ws_manager.py
from typing import Dict, List
from fastapi import WebSocket

class WSManager:
    def __init__(self):
        self.connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, review_id: str, websocket: WebSocket):
        await websocket.accept()
        self.connections.setdefault(review_id, []).append(websocket)

    def disconnect(self, review_id: str, websocket: WebSocket):
        self.connections[review_id].remove(websocket)

    async def send(self, review_id: str, data: dict):
        for ws in self.connections.get(review_id, []):
            await ws.send_json(data)

ws_manager = WSManager()