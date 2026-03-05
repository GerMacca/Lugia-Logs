import MainLayout from '../../layouts/MainLayout/MainLayout';
import FeaturesSection from './sections/FeaturesSection/FeaturesSection';
import HeroSection from './sections/HeroSection/HeroSection';
import PokemonOfTheDay from '../../components/PokemonOfTheDay/PokemonOfTheDay';

const LandingPage: React.FC = () => {
  return (
    <MainLayout>
      <HeroSection />
      <FeaturesSection />
      <PokemonOfTheDay />
    </MainLayout>
  );
};

export default LandingPage;
