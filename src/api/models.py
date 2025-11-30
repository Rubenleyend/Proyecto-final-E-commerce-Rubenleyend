from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import String, Boolean, Text, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, timezone

db = SQLAlchemy()

# -----------------------------
# Usuario
# -----------------------------

class User(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    password: Mapped[str] = mapped_column(nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean(), nullable=False)

    cart_items: Mapped[list["CartItem"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )

    def serialize(self):
        return {
            "id": self.id,
            "email": self.email,
        }

# -----------------------------
# Producto
# -----------------------------

class Product(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text)
    price_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    image_url: Mapped[str] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(timezone.utc))

    cart_items: Mapped[list["CartItem"]] = relationship(
        back_populates="product", cascade="all, delete-orphan"
    )

    def serialize(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "price_cents": self.price_cents,
            "image_url": self.image_url,
            "created_at": self.created_at.isoformat(),
        }

# -----------------------------
# CartItem
# -----------------------------

class CartItem(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id"), nullable=False)
    product_id: Mapped[int] = mapped_column(ForeignKey("product.id"), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(timezone.utc))

    user: Mapped["User"] = relationship(back_populates="cart_items")
    product: Mapped["Product"] = relationship(back_populates="cart_items")

    def serialize(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "product": self.product.serialize() if self.product else None,
            "quantity": self.quantity,
            "created_at": self.created_at.isoformat(),
        }
