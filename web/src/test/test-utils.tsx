import { render } from '@testing-library/react'
import { ThemeProvider } from 'next-themes'

export function customRender(ui: React.ReactElement) {
  return render(ui, {
    wrapper: ({ children }) => (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
      </ThemeProvider>
    ),
  })
}

export { customRender as render } 