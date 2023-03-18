import { IConvexHalfEdge } from "./IConvexHalfEdge";
import { IFace } from "./IFace";
import { IPoint3D } from "./IPoint3D";
import { IVector } from "./IVector";

export default interface IConvexFace extends Omit<IFace, 'outerComponent'> {
    outerComponent: IConvexHalfEdge;
    getNormal(): IVector;
    projectPointOnFace(point: IPoint3D): IVector;
}