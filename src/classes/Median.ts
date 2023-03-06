import { IConvexMedian, IPoint } from "../interfaces";
import Point3D from "./Point3D";

class Median implements IConvexMedian {
    private pointSum: IPoint;
    private count: number;

    constructor() {
        this.pointSum = {
            x: 0,
            y: 0,
            z: 0
        };
        this.count = 0;
    }
    
    public addPoint(point: IPoint): void {
        this.count++;
        this.pointSum.x += point.x;
        this.pointSum.y += point.y;
        this.pointSum.z += point.z;
    }

    public getMedianPoint(): Point3D {
        const medianPoint = {
            x: this.pointSum.x / this.count,
            y: this.pointSum.y / this.count,
            z: this.pointSum.z / this.count
        };

        return new Point3D(medianPoint.x, medianPoint.y, medianPoint.z);
        
    }
};

export default Median;
