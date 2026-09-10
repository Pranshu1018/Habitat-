import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SylvaHero } from "@designcodeio/threeui";

interface SceneProps {
  onDiscoverClick?: () => void;
  className?: string;
}

export function Scene({ onDiscoverClick, className = "" }: SceneProps) {
  const navigate = useNavigate();

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === "NAVIGATE" && e.data?.path) {
        navigate(e.data.path);
      } else if (e.data?.type === "SCROLL_DOWN") {
        if (onDiscoverClick) {
          onDiscoverClick();
        } else {
          navigate("/site-analysis");
        }
      }

    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [navigate, onDiscoverClick]);

  return (
    <div className={`shader-frame ${className}`}>
      <SylvaHero
        variant="living-green"
        headingFont="lexend"
        bodyFont="lexend"
        headingWeight="300"
        bodyWeight="300"
        primaryColor="#ffffff"
        headingSize={63}
        bodySize={16.5}
        headingLetterSpacing={-0.006}
      />
    </div>
  );
}

export default Scene;
