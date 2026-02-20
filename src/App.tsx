import { HashRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import CubeDirectionalLight from './components/CubeDirectionalLight';
import FSample from './components/FSample';
import Dashboard from './components/Dashboard';
import RouteMap from './constants/routes';
import CameraInputControl from './components/CameraInputControl';
import ShaderFractal from './components/ShaderFractal';

function App () {
  return (
    <HashRouter>
      <Routes>
        <Route path={RouteMap.DASHBOARD} element={<Dashboard />} />
        <Route path={RouteMap.F_MATRIX_PERSPECTIVE} element={<FSample />} />
        <Route path={RouteMap.CUBE_DIRECTIONAL_LIGHT} element={<CubeDirectionalLight />} />
        <Route path={RouteMap.CAMERA_INPUT_CONTROL} element={<CameraInputControl />} />
        <Route path={RouteMap.SHADER_FRACTAL} element={<ShaderFractal />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
