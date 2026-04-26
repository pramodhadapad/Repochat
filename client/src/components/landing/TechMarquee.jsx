import React from 'react';
import {
  SiPython,
  SiJavascript,
  SiTypescript,
  SiReact,
  SiNextdotjs,
  SiNodedotjs,
  SiGo,
  SiRust,
  SiOpenjdk,
  SiKotlin,
  SiSwift,
  SiDart,
  SiC,
  SiCplusplus,
  SiDotnet,
  SiPhp,
  SiRuby,
  SiHtml5,
  SiCss,
  SiSass,
  SiMysql,
  SiGnubash,
  SiScala,
  SiR,
  SiVuedotjs,
  SiAngular,
  SiSvelte,
  SiSupabase,
  SiDocker,
  SiGit
} from 'react-icons/si';

const marqueeRow1 = [
  { name: 'Python', icon: SiPython, color: '#3776AB' },
  { name: 'JavaScript', icon: SiJavascript, color: '#F7DF1E' },
  { name: 'TypeScript', icon: SiTypescript, color: '#3178C6' },
  { name: 'React', icon: SiReact, color: '#61DAFB' },
  { name: 'Next.js', icon: SiNextdotjs, color: '#FFFFFF' },
  { name: 'Node.js', icon: SiNodedotjs, color: '#339933' },
  { name: 'Go', icon: SiGo, color: '#00ADD8' },
  { name: 'Rust', icon: SiRust, color: '#FFFFFF' }, // Using white for Rust so it's visible on black
  { name: 'Java', icon: SiOpenjdk, color: '#007396' },
  { name: 'Kotlin', icon: SiKotlin, color: '#7F52FF' },
  { name: 'Swift', icon: SiSwift, color: '#F05138' },
  { name: 'Dart', icon: SiDart, color: '#0175C2' },
  { name: 'C', icon: SiC, color: '#A8B9CC' },
  { name: 'C++', icon: SiCplusplus, color: '#00599C' },
  { name: '.NET', icon: SiDotnet, color: '#512BD4' },
];

const marqueeRow2 = [
  { name: 'PHP', icon: SiPhp, color: '#777BB4' },
  { name: 'Ruby', icon: SiRuby, color: '#CC342D' },
  { name: 'HTML5', icon: SiHtml5, color: '#E34F26' },
  { name: 'CSS3', icon: SiCss, color: '#1572B6' },
  { name: 'Sass', icon: SiSass, color: '#CC6699' },
  { name: 'SQL', icon: SiMysql, color: '#4479A1' },
  { name: 'Bash', icon: SiGnubash, color: '#4EAA25' },
  { name: 'Scala', icon: SiScala, color: '#DC322F' },
  { name: 'R', icon: SiR, color: '#276DC3' },
  { name: 'Vue', icon: SiVuedotjs, color: '#4FC08D' },
  { name: 'Angular', icon: SiAngular, color: '#DD0031' },
  { name: 'Svelte', icon: SiSvelte, color: '#FF3E00' },
  { name: 'Supabase', icon: SiSupabase, color: '#3ECF8E' },
  { name: 'Docker', icon: SiDocker, color: '#2496ED' },
  { name: 'Git', icon: SiGit, color: '#F05032' },
];

const TechBadge = ({ name, icon: Icon, color }) => (
  <div className="flex items-center gap-2 px-6 py-3 mx-4 rounded-full bg-ferrari-surface/50 backdrop-blur-sm border border-ferrari-surface hover:border-ferrari-red hover:bg-ferrari-surface transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_4px_20px_-4px_rgba(218,41,28,0.2)] shrink-0 group/badge cursor-default">
    <Icon 
      className="w-5 h-5 transition-transform duration-300 group-hover/badge:scale-110" 
      style={{ color: color }} 
    />
    <span className="text-white text-[14px] font-medium tracking-[0.08px]">
      {name}
    </span>
  </div>
);

export const TechMarquee = ({ row = 1 }) => {
  const isRow1 = row === 1;
  const marqueeData = isRow1 ? marqueeRow1 : marqueeRow2;
  const animationClass = isRow1 ? 'animate-marquee-l' : 'animate-marquee-r';

  // Ensure the base set is wide enough to cover ultrawide screens (approx 3900px)
  const baseSet = [...marqueeData, ...marqueeData];
  // Structure the inner track to contain exactly two identical sets of items
  const trackItems = [...baseSet, ...baseSet];

  return (
    <div className="w-full flex flex-col overflow-hidden bg-ferrari-black relative">
      {isRow1 && (
        <div className="max-w-7xl mx-auto w-full px-6 mb-4">
          <h2 className="text-center text-ferrari-silver font-body uppercase text-[12px] tracking-[2px]">
            Seamlessly analyze over 30+ technologies
          </h2>
        </div>
      )}

      {/* Subtle fade effect on edges for seamless look */}
      <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-ferrari-black to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-ferrari-black to-transparent z-10 pointer-events-none" />
      
      <div className="group/row flex whitespace-nowrap pause-on-hover">
        <div className={`flex w-max ${animationClass}`}>
          {trackItems.map((tech, idx) => (
            <TechBadge key={`r${row}-${idx}`} {...tech} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TechMarquee;
