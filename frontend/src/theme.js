import { createTheme } from '@mui/material/styles';

const getTheme = (mode) => createTheme({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          primary: { main: '#2E7D32' },
          background: { default: '#f4f7f9', paper: '#ffffff' },
        }
      : {
          primary: { main: '#4CAF50' },
          background: { default: '#0d1117', paper: '#161b22' },
        }),
  },
  typography: {
    fontFamily: '"Lil Grotesk", "Segoe UI", "Roboto", "Arial", sans-serif',
    h1: { fontWeight: 700, fontSize: '3.5rem' },
    h2: { fontWeight: 700, fontSize: '3rem' },
    h3: { fontWeight: 700, fontSize: '2.5rem' },
    h4: { fontWeight: 700, fontSize: '2rem' },
    h5: { fontWeight: 700, fontSize: '1.5rem' },
    h6: { fontWeight: 500, fontSize: '1.25rem' },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: ({ theme }) => ({
          transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
          border: `1px solid ${theme.palette.divider}`,
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: `0 10px 30px 0 ${theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.25)' : 'rgba(0, 0, 0, 0.1)'}`,
          },
        }),
      },
    },
     MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 'bold',
          padding: '8px 22px',
        }
      }
    }
  },
});

export default getTheme;