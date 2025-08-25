import React from 'react'

interface WalletIconProps {
  walletId: string
  className?: string
}

export function WalletIcon({ walletId, className = "w-8 h-8" }: WalletIconProps) {
  const getIcon = () => {
    switch (walletId) {
      case 'metamask':
        return (
          <div className={`${className} flex items-center justify-center bg-orange-100 rounded-lg`}>
            <svg viewBox="0 0 40 37" className="w-6 h-6">
              <path d="M37.8 1.3L22.5 12.7l2.9-6.8z" fill="#E27625"/>
              <path d="M2.2 1.3l15.2 11.5-2.8-6.9z" fill="#E27625"/>
              <path d="M32.3 26.3l-4.2 6.4 9 2.5 2.6-8.8z" fill="#E27625"/>
              <path d="M.9 26.4l2.6 8.8 9-2.5-4.2-6.4z" fill="#E27625"/>
              <path d="M12.1 16.2L9.6 20l8.9.4-.3-9.6z" fill="#E27625"/>
              <path d="M27.9 16.2l-6.2-9.3-.3 9.7 8.9-.4z" fill="#E27625"/>
              <path d="M12.5 32.7l5.4-2.6-4.6-3.6z" fill="#E27625"/>
              <path d="M22.1 30.1l5.4 2.6-.8-6.2z" fill="#E27625"/>
            </svg>
          </div>
        )
      case 'trustwallet':
        return (
          <div className={`${className} flex items-center justify-center bg-blue-100 rounded-lg`}>
            <svg viewBox="0 0 32 32" className="w-6 h-6">
              <path d="M16 32C7.163 32 0 24.837 0 16S7.163 0 16 0s16 7.163 16 16-7.163 16-16 16z" fill="#3375BB"/>
              <path d="M20.586 11.414L16 16l-4.586-4.586a2 2 0 11-2.828 2.828L16 21.656l7.414-7.414a2 2 0 10-2.828-2.828z" fill="#fff"/>
            </svg>
          </div>
        )
      case 'binance':
        return (
          <div className={`${className} flex items-center justify-center bg-yellow-100 rounded-lg`}>
            <svg viewBox="0 0 32 32" className="w-6 h-6">
              <path d="M16 32C7.163 32 0 24.837 0 16S7.163 0 16 0s16 7.163 16 16-7.163 16-16 16z" fill="#F3BA2F"/>
              <path d="M12.116 14.404L16 10.52l3.886 3.886 2.26-2.26L16 6l-6.144 6.144 2.26 2.26zM6 16l2.26-2.26L10.52 16l-2.26 2.26L6 16zm6.116 1.596L16 21.48l3.886-3.886 2.26 2.26L16 26l-6.144-6.144 2.26-2.26zm7.764-7.764L16 13.48l-3.88-3.88L14.38 7.34 16 5.72l1.62 1.62 2.26 2.26z" fill="#fff"/>
            </svg>
          </div>
        )
      case 'coinbase':
        return (
          <div className={`${className} flex items-center justify-center bg-blue-100 rounded-lg`}>
            <svg viewBox="0 0 32 32" className="w-6 h-6">
              <path d="M16 32C7.163 32 0 24.837 0 16S7.163 0 16 0s16 7.163 16 16-7.163 16-16 16z" fill="#0052FF"/>
              <path d="M16 6.4c-5.302 0-9.6 4.298-9.6 9.6s4.298 9.6 9.6 9.6 9.6-4.298 9.6-9.6S21.302 6.4 16 6.4zm0 16c-3.536 0-6.4-2.864-6.4-6.4s2.864-6.4 6.4-6.4 6.4 2.864 6.4 6.4-2.864 6.4-6.4 6.4z" fill="#fff"/>
              <rect x="12" y="14" width="8" height="4" rx="2" fill="#fff"/>
            </svg>
          </div>
        )
      case 'walletconnect':
        return (
          <div className={`${className} flex items-center justify-center bg-blue-100 rounded-lg`}>
            <svg viewBox="0 0 32 32" className="w-6 h-6">
              <path d="M9.5 14.6c3.8-3.7 10.2-3.7 14 0l.5.4c.2.2.2.5 0 .7l-1.6 1.6c-.1.1-.2.1-.4 0l-.6-.6c-2.7-2.6-7.1-2.6-9.8 0l-.7.7c-.1.1-.3.1-.4 0L9 15.8c-.2-.2-.2-.5 0-.7l.5-.5zm17.3 3.3l1.4 1.4c.2.2.2.5 0 .7l-6.3 6.2c-.2.2-.5.2-.7 0L16 21l-5.2 5.2c-.2.2-.5.2-.7 0l-6.3-6.2c-.2-.2-.2-.5 0-.7l1.4-1.4c.2-.2.5-.2.7 0L11 23l5.2-5.2c.2-.2.5-.2.7 0L22 23l5.1-5.1c.2-.2.5-.2.7 0z" fill="#3B99FC"/>
            </svg>
          </div>
        )
      default:
        return (
          <div className={`${className} flex items-center justify-center bg-gray-100 rounded-lg`}>
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-gray-600" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
        )
    }
  }

  return getIcon()
}
