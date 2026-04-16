from sqlalchemy.orm import declarative_base

Base = declarative_base()

#  VERY IMPORTANT (register models)
from app.models.user import User  # noqa