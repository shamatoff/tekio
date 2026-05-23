import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Inject <meta name="robots" content="noindex"> at build time when VITE_NOINDEX=true
    {
      name: 'inject-noindex',
      transformIndexHtml(html: string) {
        if (process.env.VITE_NOINDEX === 'true') {
          return html.replace(
            '</head>',
            '  <meta name="robots" content="noindex,nofollow">\n  </head>'
          )
        }
        return html
      },
    },
  ],
})
