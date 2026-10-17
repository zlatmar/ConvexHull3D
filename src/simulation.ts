import { IConvexPoint, IPoint } from './interfaces';

export const BOX_HALF_SIZE: IPoint = { x: 500, y: 500, z: 250 };
export interface Particle { point: IConvexPoint; velocity: IPoint; }

export function seededRandom(seed: number): () => number {
    return () => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        return seed / 4294967296;
    };
}

export function createParticles(count: number, random: () => number = Math.random): Particle[] {
    return Array.from({ length: count }, (_, i) => ({
        point: { number: i + 1, x: (random() - 0.5) * 900, y: (random() - 0.5) * 900, z: (random() - 0.5) * 250 },
        velocity: { x: (random() - 0.5) * 140, y: (random() - 0.5) * 140, z: (random() - 0.5) * 140 }
    }));
}

/** Reflects overshoot too, including steps spanning several wall collisions. */
export function advanceParticles(particles: Particle[], seconds: number, bounds: IPoint = BOX_HALF_SIZE): void {
    if (!Number.isFinite(seconds) || seconds < 0) throw new RangeError('Elapsed time must be finite and nonnegative.');
    if (seconds === 0) return;
    for (const { point, velocity } of particles) {
        for (const axis of ['x', 'y', 'z'] as const) {
            const half = bounds[axis], span = half * 2;
            const next = point[axis] + velocity[axis] * seconds;
            if (next > -half && next < half) { point[axis] = next; continue; }
            const phase = ((next + half) % (2 * span) + 2 * span) % (2 * span);
            point[axis] = (phase <= span ? phase : 2 * span - phase) - half;
            if (phase === 0) velocity[axis] = Math.abs(velocity[axis]);
            else if (phase === span) velocity[axis] = -Math.abs(velocity[axis]);
            else if (phase > span) velocity[axis] *= -1;
        }
    }
}
