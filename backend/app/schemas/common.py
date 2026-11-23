"""Reusable constrained field types shared by request schemas."""

from typing import Annotated

from pydantic import AfterValidator, Field, StringConstraints

# bcrypt only uses the first 72 bytes of a password, so longer ones are rejected.
BCRYPT_MAX_BYTES = 72
PASSWORD_MIN_LENGTH = 8
PASSWORD_MAX_LENGTH = 72
MAX_ALLERGIES = 30


def _password_fits_bcrypt(value: str) -> str:
    if len(value.encode("utf-8")) > BCRYPT_MAX_BYTES:
        raise ValueError(f"Password must be at most {BCRYPT_MAX_BYTES} bytes.")
    return value


NewPassword = Annotated[
    str,
    Field(min_length=PASSWORD_MIN_LENGTH, max_length=PASSWORD_MAX_LENGTH),
    AfterValidator(_password_fits_bcrypt),
]

# Existing passwords are only compared, never stored; a loose upper bound stops abuse.
ExistingPassword = Annotated[str, Field(min_length=1, max_length=128)]

FullName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=255)]

AllergyName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]

AllergyList = Annotated[list[AllergyName], Field(max_length=MAX_ALLERGIES)]

# Same ranges as the onboarding form (Flutter + React).
Age = Annotated[int, Field(ge=10, le=100)]
HeightCm = Annotated[float, Field(gt=0, le=300)]
WeightKg = Annotated[float, Field(gt=0, le=500)]
