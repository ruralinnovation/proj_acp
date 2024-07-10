import './App.css'

import ACPMap from './components/ACPMap';

import { createTheme, ThemeProvider } from '@mui/material/styles';

const theme = createTheme({
  typography: {
      fontFamily: 'Lato',
  },
  palette: {
      primary: {
          main: '#234FBF',
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
