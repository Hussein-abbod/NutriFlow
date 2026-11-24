"""
Reject oversized request bodies before they are read or parsed.

The largest legitimate body is a food photo: 5 MB as base64 (~6.7 MB) inside JSON. Without
this limit FastAPI would read and parse any body size into memory before validation runs.
"""

import json

from starlette.types import ASGIApp, Receive, Scope, Send

MAX_REQUEST_BODY_BYTES = 8 * 1024 * 1024  # 8 MB
_BODY_METHODS = {b"POST", b"PUT", b"PATCH"}


async def _reject(send: Send, status: int, detail: str) -> None:
    body = json.dumps({"detail": detail}).encode()
    await send({
        "type": "http.response.start",
        "status": status,
        "headers": [(b"content-type", b"application/json"), (b"content-length", str(len(body)).encode())],
    })
    await send({"type": "http.response.body", "body": body})


class RequestSizeLimitMiddleware:
    """413 when Content-Length is too large; 411 for bodies sent without a length (chunked)."""

    def __init__(self, app: ASGIApp, max_bytes: int = MAX_REQUEST_BODY_BYTES) -> None:
        self.app = app
        self.max_bytes = max_bytes

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http" or scope["method"].encode() not in _BODY_METHODS:
            await self.app(scope, receive, send)
            return

        headers = dict(scope["headers"])
        length = headers.get(b"content-length")
        if length is None:
            if headers.get(b"transfer-encoding"):
                await _reject(send, 411, "Content-Length is required.")
                return
        elif not length.isdigit():
            await _reject(send, 400, "Invalid Content-Length.")
            return
        elif int(length) > self.max_bytes:
            await _reject(send, 413, "Request body is too large.")
            return
        await self.app(scope, receive, send)
