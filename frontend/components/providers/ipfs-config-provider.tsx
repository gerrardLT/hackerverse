'use client'

import { createContext, useContext, useEffect, ReactNode } from 'react'

interface IPFSConfig {
  pinataGateway?: string
}

const IPFSConfigContext = createContext<IPFSConfig>({})

export function IPFSConfigProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // 设置Pinata网关到全局对象
    // 这里可以从环境变量或配置中获取
    const pinataGateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY
    
    if (pinataGateway) {
      // 设置到全局对象，供IPFS服务使用
      ;(window as any).__PINATA_GATEWAY__ = pinataGateway
      console.log('✅ Pinata网关已配置:', pinataGateway)
    } else {
      console.log('⚠️ 未配置Pinata专用网关，将使用公共网关')
    }
  }, [])

  return (
    <IPFSConfigContext.Provider value={{}}>
      {children}
    </IPFSConfigContext.Provider>
  )
}

export function useIPFSConfig() {
  return useContext(IPFSConfigContext)
}
