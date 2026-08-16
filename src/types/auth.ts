export interface User {
  id: string
  email: string
  nombre: string
  rol: 'admin' | 'contador' | 'cliente'
  estudio_id: string
}

export interface Session {
  user: User
  access_token: string
  expires_at: number
}

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput {
  nombre: string
  email: string
  password: string
  confirmPassword: string
}
