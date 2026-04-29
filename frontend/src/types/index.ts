export interface Portal {
  id: number
  name: string
  url: string
  icon: string
  group_id: number | null
  sort_order: number
  account: string
  password: string
  notes: string
  is_visible: boolean
  open_in_new_tab: boolean
}

export interface PortalPublic {
  id: number
  name: string
  url: string
  icon: string
  group_id: number | null
  sort_order: number
  is_visible: boolean
  open_in_new_tab: boolean
}

export interface Group {
  id: number
  name: string
  icon: string
  sort_order: number
}

export interface PortalFormData {
  name: string
  url: string
  icon: string
  group_id: number | null
  sort_order: number
  account: string
  password: string
  notes: string
  is_visible: boolean
  open_in_new_tab: boolean
}
