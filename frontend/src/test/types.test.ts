import { describe, it, expect } from 'vitest'
import type { Portal, Group, PortalPublic, PortalFormData } from '../types'

describe('Type definitions compile correctly', () => {
  it('Portal has all required fields', () => {
    const portal: Portal = {
      id: 1,
      name: 'Test',
      url: 'https://example.com',
      icon: '',
      group_id: null,
      sort_order: 0,
      account: 'admin',
      password: 'secret',
      notes: 'note',
      is_visible: true,
      open_in_new_tab: true,
    }
    expect(portal.id).toBe(1)
    expect(portal.name).toBe('Test')
    expect(portal.url).toBe('https://example.com')
    expect(portal.group_id).toBeNull()
  })

  it('PortalPublic excludes sensitive fields', () => {
    const pub: PortalPublic = {
      id: 1,
      name: 'Test',
      url: 'https://example.com',
      icon: '',
      group_id: null,
      sort_order: 0,
      is_visible: true,
      open_in_new_tab: true,
    }
    expect(pub).not.toHaveProperty('account')
    expect(pub).not.toHaveProperty('password')
    expect(pub).not.toHaveProperty('notes')
  })

  it('Group has expected fields', () => {
    const group: Group = { id: 1, name: 'Servers', icon: 'server', sort_order: 0 }
    expect(group.name).toBe('Servers')
  })

  it('PortalFormData defaults can be set', () => {
    const form: PortalFormData = {
      name: 'My Router',
      url: 'http://192.168.1.1',
      icon: '',
      group_id: null,
      sort_order: 0,
      account: 'admin',
      password: 'pass',
      notes: '',
      is_visible: true,
      open_in_new_tab: true,
    }
    expect(form.is_visible).toBe(true)
  })
})
