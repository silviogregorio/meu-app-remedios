import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Shield, Activity, Sunrise, Footprints } from 'lucide-react';
import confetti from 'canvas-confetti';

// Map icon names to Lucide components
const ICON_MAP = {
    star: Star,
    shield: Shield,
    activity: Activity,
    sunrise: Sunrise,
    footsteps: Footprints,
    default: Trophy
};

const AchievementNotification = ({ achievement, onClose }) => {
    useEffect(() => {
        if (achievement) {
            // Trigger confetti
            const duration = 3000;
            const end = Date.now() + duration;

            (function frame() {
                confetti({
                    particleCount: 5,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: ['#FFD700', '#FFA500', '#FF4500']
                });
                confetti({
                    particleCount: 5,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: ['#FFD700', '#FFA500', '#FF4500']
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            })();

            // Auto close after 5 seconds
            const timer = setTimeout(onClose, 5000);
            return () => clearTimeout(timer);
        }
    }, [achievement, onClose]);

    if (!achievement) return null;

    const Icon = ICON_MAP[achievement.icon] || ICON_MAP.default;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.8 }}
                className="fixed bottom-4 right-4 z-50 max-w-sm w-full"
            >
                <div className="bg-gradient-to-r from-yellow-500/90 to-amber-600/90 backdrop-blur-md border border-white/20 p-4 rounded-xl shadow-2xl flex items-center gap-4 text-white hover:scale-105 transition-transform cursor-pointer" onClick={onClose}>
                    <div className="bg-white/20 p-3 rounded-full shadow-inner animate-pulse">
                        <Icon size={32} className="text-yellow-100" />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-lg leading-tight">Conquista Desbloqueada!</h4>
                        <p className="font-medium text-yellow-50">{achievement.title}</p>
                        <p className="text-xs text-yellow-100/80 mt-1">{achievement.description}</p>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default AchievementNotification;
