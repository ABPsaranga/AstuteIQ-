from app.models.review import Review


def create_review(db, user_id, filename, result):
    review = Review(
        user_id=user_id,
        filename=filename,
        score=result["score"],
        status=result["status"],
    )

    db.add(review)
    db.commit()
    db.refresh(review)

    return review