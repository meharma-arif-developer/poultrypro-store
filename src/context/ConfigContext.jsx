import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../api'
import { STORE } from '../data/store'

const defaults = { googleClientId: '', whatsapp: '', storeName: STORE.name, deliveryDays: [2, 4] }
const ConfigContext = createContext(defaults)
export const useConfig = () => useContext(ConfigContext)

export function ConfigProvider({ children }) {
  const [cfg, setCfg] = useState(defaults)
  useEffect(() => { api.get('/config').then((c) => setCfg({ ...defaults, ...c })).catch(() => {}) }, [])
  return <ConfigContext.Provider value={cfg}>{children}</ConfigContext.Provider>
}
