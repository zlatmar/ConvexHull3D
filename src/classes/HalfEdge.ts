import { IConvexFace, IConvexPoint, IHalfEdge, IVertex } from "../interfaces";

export default class HalfEdge implements IHalfEdge {

    public id: string;
    private _origin: IVertex;
    private _twin: IHalfEdge;
    private _incidentFace: IConvexFace;
    private _next: IHalfEdge;
    private _prev: IHalfEdge;

    constructor(point1: IConvexPoint, point2: IConvexPoint, incidentFace: IConvexFace | null) {
        this.id = `${point1.number}-${point2.number}`; // ${incidentFace?.id ? ':' + incidentFace.id : ''}
        if (incidentFace) {
            this._incidentFace = incidentFace;
        }
    }

    public get origin() {
        return this._origin;
    }
    public set origin(originVertex: IVertex) {
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
