import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import 'react-photo-view/dist/react-photo-view.css';
import './i18n'
import { Tooltip } from "radix-ui";
import App from './App.tsx'
import { SidebarProvider } from './components/sidebar/SidebarProvider.tsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './providers/Theme.tsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <Tooltip.Provider>
    <SidebarProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <React.StrictMode>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </React.StrictMode>
        </ThemeProvider>
      </QueryClientProvider>
    </SidebarProvider>
  </Tooltip.Provider>,
)