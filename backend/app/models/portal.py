from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, func
from app.core.database import Base


class Group(Base):
    __tablename__ = "groups"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    icon = Column(String(50), default="")
    sort_order = Column(Integer, default=0)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)


class Portal(Base):
    __tablename__ = "portals"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    url = Column(String(500), nullable=False)
    icon = Column(String(500), default="")
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=True)
    sort_order = Column(Integer, default=0)
    account = Column(String(200), default="")
    password = Column(String(500), default="")
    notes = Column(Text, default="")
    is_visible = Column(Boolean, default=True)
    open_in_new_tab = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
