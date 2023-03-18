import { IConvexFace, IConvexHalfEdge, IConvexVertex, IHalfEdge } from "../interfaces";

export default class ConvexHalfEdge implements IConvexHalfEdge {
    public id: string;
    private _origin: IConvexVertex;
    private _twin: IHalfEdge;
    private _incidentFace: IConvexFace;
    private _next: IHalfEdge;
    private _prev: IHalfEdge;

    constructor(id: string, incidentFace: IConvexFace | null) {
        this.id = id;
        if (incidentFace) {
            this._incidentFace = incidentFace;
        }
    }

    public get origin() {
        return this._origin;
    }
    public set origin(originVertex: IConvexVertex) {
        this._origin = originVertex;
    }

    public get incidentFace() {
        return this._incidentFace;
    }

    public get next() {
        return this._next;
    }
    public set next(nextHalfEdge: IHalfEdge) {
        this._next = nextHalfEdge;
    }

    public get prev() {
        return this._prev;
    }
    public set prev(prevHalfEdge: IHalfEdge) {
        this._prev = prevHalfEdge;
    }

    public get twin() {
        return this._twin;
    }
    public set twin(twinHalfEdge: IHalfEdge) {
        this._twin = twinHalfEdge;
    }
}
