from pydantic import BaseModel
from typing import Optional


class UserCreate(BaseModel):
    username: str
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class GroupBase(BaseModel):
    name: str
    icon: str = ""
    sort_order: int = 0


class GroupCreate(GroupBase):
    pass


class GroupUpdate(GroupBase):
    name: Optional[str] = None
    icon: Optional[str] = None
    sort_order: Optional[int] = None


class GroupResponse(GroupBase):
    id: int

    class Config:
        from_attributes = True


class PortalBase(BaseModel):
    name: str
    url: str
    icon: str = ""
    group_id: Optional[int] = None
    sort_order: int = 0
    account: str = ""
    password: str = ""
    notes: str = ""
    is_visible: bool = True
    open_in_new_tab: bool = True


class PortalCreate(PortalBase):
    pass


class PortalUpdate(BaseModel):
    name: Optional[str] = None
    url: Optional[str] = None
    icon: Optional[str] = None
    group_id: Optional[int] = None
    sort_order: Optional[int] = None
    account: Optional[str] = None
    password: Optional[str] = None
    notes: Optional[str] = None
    is_visible: Optional[bool] = None
    open_in_new_tab: Optional[bool] = None


class PortalResponse(PortalBase):
    id: int

    class Config:
        from_attributes = True


class PortalPublic(BaseModel):
    id: int
    name: str
    url: str
    icon: str = ""
    group_id: Optional[int] = None
    sort_order: int = 0
    is_visible: bool = True
    open_in_new_tab: bool = True

    class Config:
        from_attributes = True


class SortUpdate(BaseModel):
    id: int
    sort_order: int
    group_id: Optional[int] = None


class BatchSortUpdate(BaseModel):
    items: list[SortUpdate]
