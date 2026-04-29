from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.portal import Group
from app.models.user import User
from app.api.auth import get_current_user
from app.schemas.schemas import GroupCreate, GroupUpdate, GroupResponse

router = APIRouter(prefix="/api/groups", tags=["groups"])


@router.get("", response_model=List[GroupResponse])
def list_groups(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Group).filter(Group.user_id == current_user.id).order_by(Group.sort_order).all()


@router.post("", response_model=GroupResponse)
def create_group(
    group_data: GroupCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    group = Group(
        name=group_data.name,
        icon=group_data.icon,
        sort_order=group_data.sort_order,
        user_id=current_user.id,
    )
    db.add(group)
    db.commit()
    db.refresh(group)
    return group


@router.put("/{group_id}", response_model=GroupResponse)
def update_group(
    group_id: int,
    group_data: GroupUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    group = db.query(Group).filter(Group.id == group_id, Group.user_id == current_user.id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    update_data = group_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(group, key, value)

    db.commit()
    db.refresh(group)
    return group


@router.delete("/{group_id}")
def delete_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    group = db.query(Group).filter(Group.id == group_id, Group.user_id == current_user.id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    db.delete(group)
    db.commit()
    return {"ok": True}
