// theme.ts
//import { colors, fontFamily, fontSize, borderRadius, spacing, animation } from './tokens'

export const customTheme = createTheme({
  button: {
    color: {
      primary: 'bg-[#108FFF] text-white hover:opacity-80 focus:ring-4 focus:ring-[#B3DFFF]',
      secondary: 'bg-[#ACD3FD] text-dark hover:bg-[#94C8FC]',
      success: 'bg-[#46C954] text-white hover:bg-[#3DBB4B]',
      danger: 'bg-[#FF0000] text-white hover:bg-[#CC0000]',
    },
    size: {
      md: 'text-sm px-5 py-2.5 rounded-md font-medium',
      lg: 'text-base px-6 py-3 rounded-lg font-semibold',
    },
  },
})