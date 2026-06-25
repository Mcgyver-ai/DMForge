'use client'
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, signOut } from 'firebase/auth'
import { auth, googleProvider } from '@/lib/firebase'

const AuthCtx = createContext({ user: null, loading: true })

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => { setUser(u); setLoading(false) })
    return () => unsub()
  }, [])

  const login = (email, pw) => signInWithEmailAndPassword(auth, email, pw)
  const signup = (email, pw) => createUserWithEmailAndPassword(auth, email, pw)
  const loginWithGoogle = () => signInWithPopup(auth, googleProvider)
  const logout = () => signOut(auth)
  const getToken = useCallback(async () => user ? await user.getIdToken() : null, [user])

  return <AuthCtx.Provider value={{ user, loading, login, signup, loginWithGoogle, logout, getToken }}>{children}</AuthCtx.Provider>
}

export function useAuth() { return useContext(AuthCtx) }

// Helper: authenticated fetch that auto-attaches the ID token
export async function authFetch(url, opts = {}, getToken) {
  const token = getToken ? await getToken() : null
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return fetch(url, { ...opts, headers })
}
