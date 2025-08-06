import { CreateRooms } from "../components/create-rooms";
import Hero from "../components/landing-section/hero";
import BannerText from "../components/landing-section/banner-text";
import Footer from "../components/landing-section/footer";
import HowItWorks from "../components/landing-section/how-it-works";
const HomePage = () => {
  return (
    <div className="container font-poppins min-h-screen mx-auto max-w-full md:max-w-11/12">
      <Hero />
      <BannerText />
      <HowItWorks />
      <CreateRooms />
      <Footer />
    </div>
  );
};

export default HomePage;
