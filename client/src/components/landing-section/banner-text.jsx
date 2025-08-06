import GradientText from "../gradient-text";
const BannerText = () => {
  return (
    <div className="flex items-center justify-center p-10 bg-gray-200/20">
      <GradientText
        colors={["#8355E0", "#570EE8", "#8355E0", "#570EE8", "#8355E0"]}
        animationSpeed={10}
        showBorder={false}
        className="text-4xl !font-bold"
      >
        Turn any YouTube video into a karaoke party!
      </GradientText>
    </div>
  );
};

export default BannerText;
