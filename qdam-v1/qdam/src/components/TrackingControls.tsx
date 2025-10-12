// src/components/TrackingControls.tsx
import React from 'react';
import { Play, Pause, Square, Route } from 'lucide-react'; 
import type { TrackingState } from '../types';

// --- Reusable Button Sub-components  ---

const GameControlButton: React.FC<{icon: React.ReactNode, label: string, onClick?: () => void}> = ({ icon, label, onClick }) => (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 px-4 py-1 text-white uppercase font-bold tracking-wider text-xs group transition-transform duration-150 ease-in-out hover:scale-105 active:scale-100">
        <div className="p-3 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full border-2 border-gray-600 shadow-lg group-hover:border-teal-400 group-hover:shadow-teal-400/50 transition-all duration-200">
            {icon}
        </div>
        <span>{label}</span>
    </button>
);

const MainActionButton: React.FC<{icon: React.ReactNode, label: string, onClick?: () => void, className?: string}> = ({ icon, label, onClick, className }) => (
    <button onClick={onClick} className="relative group mx-2">
        <div className={`absolute -inset-1 bg-gradient-to-r ${className} rounded-full blur opacity-80 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt`}></div>
        <div className="relative flex items-center justify-center gap-2 px-8 py-4 bg-gray-900 rounded-full text-white font-bold text-lg uppercase tracking-widest leading-none">
            {icon}
            <span>{label}</span>
        </div>
    </button>
);


// --- Main Component ---
interface TrackingControlsProps {
    trackingState: TrackingState;
    onStart: () => void;
    onStop: () => void;
    onPause: () => void;
    onResume: () => void;
    onSimulateClick: () => void;
    simulationState: 'idle' | 'pickingStart' | 'pickingEnd' | 'ready' | 'simulating';
}

export const TrackingControls: React.FC<TrackingControlsProps> = ({ trackingState, onStart, onStop, onPause, onResume, onSimulateClick, simulationState}) => {

    const renderControls = () => {
        if (simulationState === 'ready') {
            return (
                <MainActionButton
                    icon={<Play size={20} fill="currentColor"/>}
                    label="Play Simulation"
                    onClick={onStart} 
                    className="from-blue-400 to-purple-500"
                />
            );
        }
        switch (trackingState) {
            case 'recording':
                return (
                    <>
                        <GameControlButton icon={<Route size={14} />} label="Simulate" onClick={onSimulateClick} />

                        <MainActionButton
                            icon={<Pause size={14} fill="currentColor"/>}
                            label="Pause"
                            onClick={onPause}
                            className="from-yellow-400 to-orange-500"
                        />
                        <MainActionButton
                            icon={<Square size={14} fill="currentColor"/>}
                            label="Stop"
                            onClick={onStop}
                            className="from-red-500 to-pink-500"
                        />
                    </>
                );
            case 'paused':
                return (
                    <>
                        <GameControlButton icon={<Route size={14} />} label="Simulate" onClick={onSimulateClick} />

                        <MainActionButton
                            icon={<Play size={14} fill="currentColor"/>}
                            label="Continue"
                            onClick={onResume}
                            className="from-green-400 to-cyan-500"
                        />
                         <MainActionButton
                            icon={<Square size={14} fill="currentColor"/>}
                            label="Stop"
                            onClick={onStop}
                            className="from-red-500 to-pink-500"
                        />
                    </>
                );
            case 'idle':
            default:
                 return (
                    <>
                        <MainActionButton
                            icon={<Play size={20} fill="currentColor"/>}
                            label="Start"
                            onClick={onStart}
                            className="from-green-400 to-cyan-500"
                        />
                    </>
                );
        }
    };
    
    return (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-neutral-900 bg-opacity-70 backdrop-blur-md rounded-full flex items-center justify-center p-2 shadow-2xl border border-gray-700 z-20">
            {renderControls()}
        </div>
    );
};