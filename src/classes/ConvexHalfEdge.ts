import { IConvexFace, IConvexHalfEdge, IConvexVertex } from '../interfaces';

export default class ConvexHalfEdge implements IConvexHalfEdge {
    public origin: IConvexVertex;
    public twin: IConvexHalfEdge;
    public next: IConvexHalfEdge;
    public prev: IConvexHalfEdge;
    public incidentFace: IConvexFace;

    constructor(public id: string, face: IConvexFace | null) {
        if (face) this.incidentFace = face;
    }
}
