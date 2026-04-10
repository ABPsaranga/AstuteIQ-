from sqlalchemy.orm import Session

from app.models.user import User


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()


def get_user_by_id(db: Session, user_id: int) -> User | None:
    return db.query(User).filter(User.id == user_id).first()


def create_user(
    db: Session,
    full_name: str,
    email: str,
    password_hash: str,
    practice_name: str | None = None,
) -> User:
    user = User(
        full_name=full_name,
        email=email,
        password_hash=password_hash,
        practice_name=practice_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
