import confetti from 'canvas-confetti';
export const celebrate = () => {
    const colors = ['#8B5CF6', '#EC4899', '#F97316', '#FBBF24', '#22C55E'];

    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors,
        disableForReducedMotion: true,
    });
};

export const celebrateSubtle = () => {
    confetti({
        particleCount: 30,
        spread: 40,
        origin: { y: 0.7 },
        colors: ['#8B5CF6', '#EC4899', '#FBBF24'],
        ticks: 100,
        disableForReducedMotion: true,
    });
};

export const celebrateBig = () => {
    const colors = ['#8B5CF6', '#EC4899', '#F97316', '#FBBF24', '#22C55E', '#3B82F6'];
    const end = Date.now() + 2000;

    const frame = () => {
        confetti({
            particleCount: 4,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors,
            disableForReducedMotion: true,
        });
        confetti({
            particleCount: 4,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors,
            disableForReducedMotion: true,
        });

        if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
};