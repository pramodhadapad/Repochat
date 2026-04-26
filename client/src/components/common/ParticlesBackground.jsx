import { useEffect, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { useTheme } from "./ThemeProvider";

const ParticlesBackground = () => {
  const [init, setInit] = useState(false);
  const { theme } = useTheme();

  // this should be run only once per application lifetime
  useEffect(() => {
    initParticlesEngine(async (engine) => {
      // load the thin bundle to reduce size vs the full bundle
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const isDark = theme === 'dark';

  const options = {
    background: {
      color: {
        value: "transparent",
      },
      opacity: 0,
    },
    fpsLimit: 120,
    interactivity: {
      events: {
        onClick: {
          enable: true,
          mode: "push",
        },
        onHover: {
          enable: true,
          mode: "repulse",
        },
        resize: {
            enable: true
        }
      },
      modes: {
        push: {
          quantity: 2,
        },
        repulse: {
          distance: 200, // Increased from 100 for stronger reaction
          duration: 0.4,
          factor: 100,
          speed: 1,
          maxSpeed: 50,
        },
      },
    },
    particles: {
      color: {
        // Subtle blue-ish for dark mode, crisp distinct for light mode
        value: isDark ? "#818cf8" : "#6366f1",
      },
      links: {
        color: isDark ? "#4f46e5" : "#a5b4fc",
        distance: 150,
        enable: true,
        opacity: isDark ? 0.3 : 0.4,
        width: 1,
      },
      move: {
        direction: "none",
        enable: true,
        outModes: {
          default: "bounce",
        },
        random: false,
        speed: 1.5, // Slightly faster movement
        straight: false,
      },
      number: {
        density: {
          enable: true,
          area: 800,
        },
        value: 100, // Good density for landing page
      },
      opacity: {
        value: isDark ? 0.5 : 0.6,
        animation: {
            enable: true,
            speed: 0.5,
            minimumValue: 0.1,
            sync: false
        }
      },
      shape: {
        type: "circle",
      },
      size: {
        value: { min: 1, max: 2 },
      },
      shadow: {
          enable: isDark,
          color: "#818cf8",
          blur: 15
      }
    },
    detectRetina: true,
  };

  if (init) {
    return (
      <Particles
        id="tsparticles"
        options={options}
        className="absolute inset-0 z-[-1] pointer-events-auto"
      />
    );
  }

  return <></>;
};

export default ParticlesBackground;
