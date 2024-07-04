import './App.css'

import ACPMap from './components/ACPMap';

import { createTheme, ThemeProvider } from '@mui/material/styles';

const theme = createTheme({
  typography: {
      fontFamily: 'Bitter',
  },
  palette: {
      primary: {
          main: '#00835D',
          light: '#A3E2B5',
          dark: '#26535C',
          contrastText: 'white',
      },
  },
});

function App() {

  return (
    <>
      <div>
        <ThemeProvider theme={theme}>
          <ACPMap />
        </ThemeProvider>
      </div>
    </>
  )
}

export default App
