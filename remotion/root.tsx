import { Composition } from "remotion";
import { FitFlowPromo } from "./fitflow-promo";

export function RemotionRoot() {
  return (
    <Composition
      id="FitFlowPromo"
      component={FitFlowPromo}
      durationInFrames={900}
      fps={30}
      width={1920}
      height={1080}
    />
  );
}
