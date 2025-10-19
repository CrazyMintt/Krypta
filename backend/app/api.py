from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

from . import schemas, services, repository, core
from .database import get_db

router = APIRouter()


@router.post("/users/", response_model=schemas.User, status_code=status.HTTP_201_CREATED, tags=["Users"])
def create_user(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Endpoint para criar um novo usuário.
    """
    return services.register_user(db=db, user_data=user_data)
