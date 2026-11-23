"""
Server-side checks for uploaded food photos (base64 in a JSON body).

The MIME type is taken from the file's magic bytes, never from what the client claims.
"""

import base64
import binascii
import math
from dataclasses import dataclass

from fastapi import HTTPException, status

MAX_IMAGE_BYTES = 5 * 1024 * 1024  # 5 MB
# Longest base64 text that can decode to MAX_IMAGE_BYTES; anything longer is rejected unread.
MAX_BASE64_CHARS = 4 * math.ceil(MAX_IMAGE_BYTES / 3)

_PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"
_JPEG_SIGNATURE = b"\xff\xd8\xff"


@dataclass(frozen=True)
class DecodedImage:
    data: bytes
    mime_type: str


def _sniff_mime_type(data: bytes) -> str | None:
    if data.startswith(_JPEG_SIGNATURE):
        return "image/jpeg"
    if data.startswith(_PNG_SIGNATURE):
        return "image/png"
    if len(data) >= 12 and data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    return None


def _too_large() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
        detail="Image exceeds the 5 MB limit.",
    )


def decode_image(image_base64: str) -> DecodedImage:
    """Decode and validate a base64 image: 400 invalid, 413 too large, 415 wrong type."""
    if len(image_base64) > MAX_BASE64_CHARS:
        raise _too_large()
    try:
        data = base64.b64decode(image_base64, validate=True)
    except (binascii.Error, ValueError) as exc:
        raise HTTPException(status_code=400, detail="Invalid base64 image.") from exc
    if not data:
        raise HTTPException(status_code=400, detail="Invalid base64 image.")
    if len(data) > MAX_IMAGE_BYTES:
        raise _too_large()

    mime_type = _sniff_mime_type(data)
    if mime_type is None:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Only JPEG, PNG or WebP images are supported.",
        )
    return DecodedImage(data=data, mime_type=mime_type)
