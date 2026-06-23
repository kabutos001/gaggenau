import sys


MINIMUM_PYTHON = (3, 11)


def _ensure_supported_python_version() -> None:
  if sys.version_info >= MINIMUM_PYTHON:
    return

  msg = f'Python {MINIMUM_PYTHON[0]}.{MINIMUM_PYTHON[1]}+ is required'
  raise RuntimeError(msg)


_ensure_supported_python_version()
