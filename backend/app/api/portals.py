from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.security import encrypt_password, decrypt_password
from app.models.portal import Portal
from app.models.user import User
from app.api.auth import get_current_user
from app.schemas.schemas import PortalCreate, PortalUpdate, PortalResponse, PortalPublic, BatchSortUpdate

router = APIRouter(prefix="/api/portals", tags=["portals"])


@router.get("", response_model=List[PortalResponse])
def list_portals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    portals = db.query(Portal).filter(Portal.user_id == current_user.id).order_by(Portal.sort_order).all()
    result = []
    for p in portals:
        data = PortalResponse.model_validate(p)
        data.password = decrypt_password(p.password) if p.password else ""
        result.append(data)
    return result


@router.get("/public", response_model=List[PortalPublic])
def list_portals_public(db: Session = Depends(get_db)):
    has_user = db.query(Portal).first()
    if has_user is None:
        return []
    portals = db.query(Portal).filter(Portal.is_visible == True).order_by(Portal.sort_order).all()
    return [PortalPublic.model_validate(p) for p in portals]


@router.post("", response_model=PortalResponse)
def create_portal(
    portal_data: PortalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    portal = Portal(
        name=portal_data.name,
        url=portal_data.url,
        icon=portal_data.icon,
        group_id=portal_data.group_id,
        sort_order=portal_data.sort_order,
        account=portal_data.account,
        password=encrypt_password(portal_data.password) if portal_data.password else "",
        notes=portal_data.notes,
        is_visible=portal_data.is_visible,
        open_in_new_tab=portal_data.open_in_new_tab,
        user_id=current_user.id,
    )
    db.add(portal)
    db.commit()
    db.refresh(portal)
    resp = PortalResponse.model_validate(portal)
    resp.password = portal_data.password
    return resp


@router.put("/{portal_id}", response_model=PortalResponse)
def update_portal(
    portal_id: int,
    portal_data: PortalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    portal = db.query(Portal).filter(Portal.id == portal_id, Portal.user_id == current_user.id).first()
    if not portal:
        raise HTTPException(status_code=404, detail="Portal not found")

    update_data = portal_data.model_dump(exclude_unset=True)
    if "password" in update_data:
        update_data["password"] = encrypt_password(update_data["password"]) if update_data["password"] else ""

    for key, value in update_data.items():
        setattr(portal, key, value)

    db.commit()
    db.refresh(portal)
    resp = PortalResponse.model_validate(portal)
    resp.password = decrypt_password(portal.password) if portal.password else ""
    return resp


@router.delete("/{portal_id}")
def delete_portal(
    portal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    portal = db.query(Portal).filter(Portal.id == portal_id, Portal.user_id == current_user.id).first()
    if not portal:
        raise HTTPException(status_code=404, detail="Portal not found")
    db.delete(portal)
    db.commit()
    return {"ok": True}


@router.post("/sort")
def batch_update_sort(
    sort_data: BatchSortUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    for item in sort_data.items:
        portal = db.query(Portal).filter(Portal.id == item.id, Portal.user_id == current_user.id).first()
        if portal:
            portal.sort_order = item.sort_order
            if item.group_id is not None:
                portal.group_id = item.group_id
    db.commit()
    return {"ok": True}
