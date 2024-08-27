import { getDefaultChains, getDefaultWaasConnectors } from '@0xsequence/kit'
import { createConfig, http } from 'wagmi'

import '@0xsequence/design-system/styles.css'
export const projectAccessKey = 'AQAAAAAAAEGvyZiWA9FMslYeG_yayXaHnSI'
 
const chains = getDefaultChains() // optionally, supply an array of chain ID's getDefaultChains([1,137])
const transports = Object.fromEntries(chains.map((chain: any) => [chain.id, http()]))
 
// works locally on http://localhost:4444
const waasConfigKey = 'eyJwcm9qZWN0SWQiOjE2ODE1LCJlbWFpbFJlZ2lvbiI6ImNhLWNlbnRyYWwtMSIsImVtYWlsQ2xpZW50SWQiOiI2N2V2NXVvc3ZxMzVmcGI2OXI3NnJoYnVoIiwicnBjU2VydmVyIjoiaHR0cHM6Ly93YWFzLnNlcXVlbmNlLmFwcCJ9' 
const googleClientId = '970987756660-35a6tc48hvi8cev9cnknp0iugv9poa23.apps.googleusercontent.com' 
 
// apple authentication only works on deployed applications
// const appleClientId = 'com.horizon.sequence.waas'
// const appleRedirectURI =  'https://' + window.location.origin + window.location.pathname
 
const connectors = getDefaultWaasConnectors({
  walletConnectProjectId: "c65a6cb1aa83c4e24500130f23a437d8",
  defaultChainId: 42161,
  appName: 'p2p marketplace widget',
  projectAccessKey,
  waasConfigKey,
  googleClientId,
})
 
export const config = createConfig({
  transports,
  connectors,
  chains
})