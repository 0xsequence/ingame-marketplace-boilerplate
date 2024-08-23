import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "@0xsequence/design-system";
import { KitProvider } from "@0xsequence/kit";
// @ts-ignore
import { KitCheckoutProvider } from "@0xsequence/kit-checkout";
import { WagmiProvider } from "wagmi";
import { projectAccessKey, config } from './config'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'

const queryClient = new QueryClient() 

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <KitProvider config={{projectAccessKey: projectAccessKey}}>
            <KitCheckoutProvider>
              <App />
            </KitCheckoutProvider>
          </KitProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>,
);
