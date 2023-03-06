import { IConvexPoint } from "../interfaces";
import Point3D from "./Point3D";

class ConvexPoint extends Point3D implements IConvexPoint {
    number: number;

    constructor(number: number, x: number, y: number, z: number) {
        super(x, y, z);
        this.number = number;
    }

};

export default ConvexPoint;
