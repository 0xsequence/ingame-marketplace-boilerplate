import { getDefaultChains, getDefaultWaasConnectors } from '@0xsequence/kit'
import { createConfig, http } from 'wagmi'

import '@0xsequence/design-system/styles.css'
export const projectAccessKey = import.meta.env.VITE_PROJECT_ACCESS_KEY
 
const chains = getDefaultChains() // optionally, supply an array of chain ID's getDefaultChains([1,137])
const transports = Object.fromEntries(chains.map((chain: any) => [chain.id, http()]))
 
// works locally on http://localhost:4444
const waasConfigKey = import.meta.env.VITE_WAAS_CONFIG_KEY 
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
 
const connectors = getDefaultWaasConnectors({
  walletConnectProjectId: "c65a6cb1aa83c4e24500130f23a437d8",
  defaultChainId: 42161,
  appName: 'p2p marketplace overlay',
  projectAccessKey,
  waasConfigKey,
  googleClientId,
})
 
export const config = createConfig({
  transports,
  connectors,
  chains
})