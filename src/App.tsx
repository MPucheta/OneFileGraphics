import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import CubeDirectionalLight from './components/CubeDirectionalLight';
import FSample from './components/FSample';
import Dashboard from './components/Dashboard';
import RouteMap from './constants/routes';

function App () {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={RouteMap.DASHBOARD} element={<Dashboard />} />
        <Route path={RouteMap.F_MATRIX_PERSPECTIVE} element={<FSample />} />
        <Route path={RouteMap.CUBE_DIRECTIONAL_LIGHT} element={<CubeDirectionalLight />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
