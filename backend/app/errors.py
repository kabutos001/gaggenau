from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from .config import settings


def register_exception_handlers(app: FastAPI) -> None:
    """Register custom exception handlers for the FastAPI app."""

    @app.exception_handler(HTTPException)
    async def http_exception_handler(
        _request: Request, exception: HTTPException
    ) -> JSONResponse:
        detail = exception.detail

        if isinstance(detail, dict) and "error" in detail and "message" in detail:
            return JSONResponse(status_code=exception.status_code, content=detail)

        return JSONResponse(
            status_code=exception.status_code,
            content={"error": "Request error", "message": str(detail)},
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        _request: Request,
        _exception: RequestValidationError,
    ) -> JSONResponse:
        return JSONResponse(
            status_code=400,
            content={"error": "Validation error", "message": "Invalid request payload"},
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(
        _request: Request, exception: Exception
    ) -> JSONResponse:
        message = (
            exception.args[0]
            if settings.app_env == "development" and exception.args
            else None
        )
        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal server error",
                "message": message or "Something went wrong",
            },
        )
