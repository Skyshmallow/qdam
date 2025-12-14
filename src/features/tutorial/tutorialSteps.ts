// src/features/tutorial/tutorialSteps.ts

import type { TutorialStep } from './TutorialTooltip';

export const tutorialSteps: TutorialStep[] = [
  {
    id: 'step-find-me',
    title: '📍 Find Your Location',
    description: 'Click the Find Me button (pin icon) to locate yourself on the map. A blue avatar will show your position.',
    targetId: 'btn-find-me',
    position: 'left', // left sidebar button - tooltip appears to the right with arrow pointing left
    highlight: true,
  },
  {
    id: 'step-start-journey',
    title: '🚀 Start Walking',
    description: 'Once located, click START JOURNEY to begin your first route. Just walk around!',
    targetId: 'btn-start-journey',
    position: 'center', // center button - tooltip appears above with arrow pointing down
    highlight: true,
  },
  {
    id: 'step-finish-journey',
    title: '🏁 Finish Journey',
    description: 'Walk at least 100 meters, then click FINISH JOURNEY. Castles will appear at start and end points!',
    targetId: 'btn-finish-journey',
    position: 'center', // center button - tooltip appears above with arrow pointing down
    highlight: true,
  },
  {
    id: 'step-territory',
    title: '🌍 Your Territory',
    description: 'After 2-3 journeys, your territory appears — a green zone between castles. More journeys = bigger territory!',
    targetId: 'btn-start-journey',
    position: 'center',
    highlight: false,
  },
  {
    id: 'step-profile',
    title: '⚡ Player Profile',
    description: 'Open your profile (user icon) to view stats: level, territory, castles, and journey count.',
    targetId: 'btn-profile',
    position: 'left', // left sidebar button - tooltip appears to the right with arrow pointing left
    highlight: true,
  },
  {
    id: 'step-map-theme',
    title: '🗺️ Map Styles',
    description: 'Change map style (layers icon) — choose from dark, light, or satellite themes!',
    targetId: 'btn-layers',
    position: 'right', // right sidebar button - tooltip appears to the left with arrow pointing right
    highlight: true,
  },
  {
    id: 'step-complete',
    title: '🎮 Ready to Play!',
    description: 'You now know the basics! Create routes, expand territory, and compete with other players. Good luck!',
    targetId: 'btn-start-journey',
    position: 'center',
    highlight: false,
  },
];
