import { Route, Routes } from 'react-router-dom';

import GenerationDetailPage from './pages/GenerationDetailPage/GenerationDetailPage';
import GenerationsPage from './pages/GenerationsPage/GenerationsPage';
import LandingPage from './pages/LandingPage/LandingPage';
import LoginPage from './pages/LoginPage/LoginPage';
import NotFoundPage from './pages/NotFoundPage/NotFoundPage';
import PokemonDetailPage from './pages/PokemonDetailPage/PokemonDetailPage';
import PokedexPage from './pages/PokedexPage/PokedexPage';
import RegisterPage from './pages/RegisterPage/RegisterPage';
import TrainerDetailPage from './pages/TrainerDetailPage/TrainerDetailPage';
import TrainersPage from './pages/TrainersPage/TrainersPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route path="/pokedex">
        <Route index element={<PokedexPage />} />
        <Route path=":id" element={<PokemonDetailPage />} />
      </Route>

      <Route path="/trainers">
        <Route index element={<TrainersPage />} />
        <Route path=":id" element={<TrainerDetailPage />} />
      </Route>

      <Route path="/generations">
        <Route index element={<GenerationsPage />} />
        <Route path=":id" element={<GenerationDetailPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
