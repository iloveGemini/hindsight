"""Timezone helpers for user-facing and user-supplied datetimes."""

from datetime import UTC, datetime
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

DEFAULT_TIMEZONE = "UTC"


def get_timezone(name: str | None = None) -> ZoneInfo:
    """Return a configured IANA timezone, falling back to UTC when unset."""
    value = (name or DEFAULT_TIMEZONE).strip() or DEFAULT_TIMEZONE
    try:
        return ZoneInfo(value)
    except ZoneInfoNotFoundError as exc:
        raise ValueError(f"Invalid timezone {value!r}; expected an IANA timezone such as 'Asia/Shanghai'") from exc


def now() -> datetime:
    """Return the current instant in the configured timezone."""
    import os

    return datetime.now(get_timezone(os.getenv("HINDSIGHT_API_TIMEZONE")))


def to_utc(value: datetime) -> datetime:
    """Interpret naive values in the configured timezone and normalize to UTC."""
    if value.tzinfo is None:
        import os

        value = value.replace(tzinfo=get_timezone(os.getenv("HINDSIGHT_API_TIMEZONE")))
    return value.astimezone(UTC)


def format_for_prompt(value: datetime) -> str:
    """Format a datetime in the configured timezone for an LLM prompt."""
    import os

    zone_name = os.getenv("HINDSIGHT_API_TIMEZONE") or DEFAULT_TIMEZONE
    local = to_utc(value).astimezone(get_timezone(zone_name))
    return f"{local.strftime('%A, %B %d, %Y %H:%M %z')} ({zone_name}; {local.isoformat()})"
