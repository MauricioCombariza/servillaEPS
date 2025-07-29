// frontend-admin/tailwind.config.ts

import type { Config } from 'tailwindcss'

// Usamos la variable 'config' con el tipo 'Config' para tener autocompletado y verificación de tipos.
const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkser: "#1a6329",
        ser: "#009300",
        lightser: "#E3E7D3",
        whiteser: "#BDC2BF",
      },
    },
  },
  plugins: [],
}

// Exportamos la configuración como el módulo por defecto.
export default config