import GradientText from "../gradient-text";
import Lottie from "lottie-react";
import visualizer from "../../assets/lottie/visualize.json";
const Hero = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 p-4 md:p-0 min-h-screen items-center  ">
      <div className="flex justify-start flex-col">
        <GradientText
          colors={["#8355E0", "#5F2AC9", "#8355E0", "#5F2AC9", "#8355E0"]}
          animationSpeed={10}
          showBorder={false}
          className="text-4xl md:text-7xl !font-bold"
        >
          Karaoke from <span className="!text-red-500">You</span>
          <span className="!text-black">Tube</span>, in Real Time.
        </GradientText>
        <h3 className=" text-xl md:text-2xl font-light">
          No hassle. Just search, sing, and enjoy.
        </h3>
      </div>

      <Lottie animationData={visualizer} />
    </div>
  );
};

export default Hero;
