from sqlalchemy.orm import Session
from app.models.user import User

def get_user_by_id(db: Session, user_id: str):
    return db.query(User).filter(User.id == user_id).first()

def create_user(db: Session, user_id: str, email: str, role: str):
    user = User(id=user_id, email=email, role=role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user