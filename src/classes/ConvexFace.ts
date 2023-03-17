import { IConvexFace, IConvexPoint, IPoint, IVector } from "../interfaces";
import Face from "./Face";
import Point3D from "./Point3D";
import Vector from "./Vector";

class ConvexFace extends Face implements IConvexFace {
    private _originFacePoint: IPoint;
    private _nextFacePoint: IPoint;
    private _prevNextPoint: IPoint;

    constructor(originFacePoint: IConvexPoint, nextFacePoint: IConvexPoint, prevNextPoint: IConvexPoint) {
        const faceId = `${originFacePoint.number}-${nextFacePoint.number}-${prevNextPoint.number}`;
        super(faceId);
        this._originFacePoint = originFacePoint;
        this._nextFacePoint = nextFacePoint;
        this._prevNextPoint = prevNextPoint;
    }
    
    getNormal(): IVector {
        const [ vec1, vec2 ] = ConvexFace.getVectorsFromPoints(this._originFacePoint, this._nextFacePoint, this._prevNextPoint);
    
        return ConvexFace._getNormal(vec1, vec2);
    }

    projectPointOnFace(point: Point3D): IVector {
        const pointVector = point.toVector();
        const pointSubFacePoint = pointVector.substract(this._originFacePoint);

        const planeNormal = this.getNormal();
        const dot = planeNormal.dotProduct(pointSubFacePoint);
        const projection = planeNormal.scale(dot);

        return pointVector.substract(projection);
    }

    private static getVectorsFromPoints(pointOne: IPoint, pointTwo: IPoint, pointThree: IPoint) {
        const vec1 = new Vector(pointTwo.x - pointOne.x, pointTwo.y - pointOne.y, pointTwo.z - pointOne.z);
        const vec2 = new Vector(pointThree.x - pointOne.x, pointThree.y - pointOne.y,pointThree.z - pointOne.z);
    
        return [ vec1, vec2 ];
    }

    private static _getNormal(vectorOne: IPoint, vectorTwo: IPoint) {
        // cross product of vectors
        const normal: IPoint = {
            x: vectorOne.y * vectorTwo.z - vectorOne.z * vectorTwo.y,
            y: vectorOne.z * vectorTwo.x - vectorOne.x * vectorTwo.z,
            z: vectorOne.x * vectorTwo.y - vectorOne.y * vectorTwo.x
        };
    
        var length = Math.sqrt(normal.x * normal.x + normal.y * normal.y + normal.z * normal.z);
        
        normal.x = normal.x / length;
        normal.y = normal.y / length;
        normal.z = normal.z / length;
    
        return new Vector(normal.x, normal.y, normal.z);
    }

    public static getNormal(pointOne: IPoint, pointTwo: IPoint, pointThree: IPoint) {
        const [ vectorOne, vectorTwo ] = this.getVectorsFromPoints(pointOne, pointTwo, pointThree);
        return this._getNormal(vectorOne, vectorTwo);
    }
}

export default ConvexFace;
