import { orient2d, orient3d } from 'robust-predicates';
import { IConvexFace, IPoint } from '../interfaces';

/** Positive on the side pointed to by (b-a) cross (c-a). */
export function orientation(a: IPoint, b: IPoint, c: IPoint, d: IPoint): number {
    return -orient3d(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z, d.x, d.y, d.z);
}

export function areCollinear(a: IPoint, b: IPoint, c: IPoint): boolean {
    return orient2d(a.x, a.y, b.x, b.y, c.x, c.y) === 0
        && orient2d(a.x, a.z, b.x, b.z, c.x, c.z) === 0
        && orient2d(a.y, a.z, b.y, b.z, c.y, c.z) === 0;
}

export function faceSide(face: IConvexFace, point: IPoint): number {
    const edge = face.outerComponent;
    return orientation(edge.origin.toPoint(), edge.next.origin.toPoint(), edge.prev.origin.toPoint(), point);
}
