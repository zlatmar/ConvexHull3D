import { IPoint3D, IVector } from "../interfaces";
import Vector from "./Vector";

class Point3D implements IPoint3D {
    x: number;
    y: number;
    z: number;
    
    constructor(x: number, y: number, z: number) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    toVector(): IVector {
        return new Vector(this.x, this.y, this.z);
    }

};

export default Point3D;