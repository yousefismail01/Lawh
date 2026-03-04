import { useAuthStore } from '@/stores/authStore'

describe('authStore', () => {
  beforeEach(() => {
    // Reset store between tests
    useAuthStore.setState({ session: null, loading: true })
  })

  it('initial state: session null, loading true', () => {
    const state = useAuthStore.getState()
    expect(state.session).toBeNull()
    expect(state.loading).toBe(true)
  })

  it('setSession(session) sets session and loading false', () => {
    const mockSession = { user: { id: 'test-uid' } } as any
    useAuthStore.getState().setSession(mockSession)
    const state = useAuthStore.getState()
    expect(state.session).toBe(mockSession)
    expect(state.loading).toBe(false)
  })

  it('setSession(null) clears session and sets loading false', () => {
    useAuthStore.getState().setSession(null)
    const state = useAuthStore.getState()
    expect(state.session).toBeNull()
    expect(state.loading).toBe(false)
  })
})
