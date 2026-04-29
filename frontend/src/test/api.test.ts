import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('axios', () => {
  const interceptors = {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  }
  const instance = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors,
  }
  return {
    default: {
      create: vi.fn(() => instance),
    },
  }
})

describe('API service', () => {
  beforeEach(() => {
    vi.resetModules()
    localStorage.clear()
  })

  it('authApi has correct methods', async () => {
    const { authApi } = await import('../services/api')
    expect(typeof authApi.check).toBe('function')
    expect(typeof authApi.login).toBe('function')
    expect(typeof authApi.setup).toBe('function')
  })

  it('portalApi has correct methods', async () => {
    const { portalApi } = await import('../services/api')
    expect(typeof portalApi.list).toBe('function')
    expect(typeof portalApi.listPublic).toBe('function')
    expect(typeof portalApi.create).toBe('function')
    expect(typeof portalApi.update).toBe('function')
    expect(typeof portalApi.delete).toBe('function')
    expect(typeof portalApi.batchSort).toBe('function')
  })

  it('groupApi has correct methods', async () => {
    const { groupApi } = await import('../services/api')
    expect(typeof groupApi.list).toBe('function')
    expect(typeof groupApi.create).toBe('function')
    expect(typeof groupApi.update).toBe('function')
    expect(typeof groupApi.delete).toBe('function')
  })
})
