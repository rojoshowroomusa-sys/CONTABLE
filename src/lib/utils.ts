import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'ARS'): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: string | Date, formatStr = 'dd/MM/yyyy'): string {
  const parsed = typeof date === 'string' ? parseISO(date) : date
  return format(parsed, formatStr, { locale: es })
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('es-AR').format(num)
}
