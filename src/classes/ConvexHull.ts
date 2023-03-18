import ConvexDcel from "../ConvexDcel";
import { IConvexPoint, IHalfEdge, IPoint, IVector } from "../interfaces";
import ConflictGraph from "../types/ConflictGraph";
import ConvexFace from "./ConvexFace";
import ConvexPoint from "./ConvexPoint";
import Median from "./Median";
import Point3D from "./Point3D";


export class ConvexHull {
    private convexDcel: ConvexDcel;
    private conflictGraph: ConflictGraph; // bipartite graph
    private median: Median;
    private originPoints: IConvexPoint[];

    constructor(points: IConvexPoint[]) {
        this.originPoints = points;
        this.median = new Median();
        this.conflictGraph = { points: {}, faces: {} };
        this.calculate(points.map(p => new ConvexPoint(p.number, p.x, p.y, p.z)));
    }

    private calculate(convexPoints: ConvexPoint[]) {
        try {
            const [ initialPoints, points ] = this.getInitialPoints(convexPoints);
            this.convexDcel = new ConvexDcel(initialPoints); // init DCEL in constructor
            initialPoints.forEach(p => {
                this.median.addPoint(p);
            });

            this.createConflictGraph(points);

            for (let i = 0; i < points.length; i++) {
                const point = points[i];
                this.median.addPoint(point);
                const conflictFaceIds = this.conflictGraph.points[`${point.number}`];
                if (conflictFaceIds && conflictFaceIds.length) {
                    this.updateConvexHull(point, conflictFaceIds);
                }
            }
        }
        catch (err) {
            console.warn(err)
            console.warn(this.originPoints)
        }
    }

    private updateConvexHull(point: ConvexPoint, conflictFaceIds: string[]) {
        const copiedConflictFaceIds = [...conflictFaceIds]
        let horizonHalfEdges: IHalfEdge[] = [];
        copiedConflictFaceIds.forEach(faceId => {
            const visibleFace = this.convexDcel.faces[faceId];
            const halfEdges = this.getHorizonEdges(visibleFace, copiedConflictFaceIds);
            horizonHalfEdges = horizonHalfEdges.concat(halfEdges);
            // delete this.conflictGraph.faces[faceId];
            
            const conflictPoitns = this.conflictGraph.points;
            for (const pointId in conflictPoitns) {
                if (conflictPoitns.hasOwnProperty(pointId)) {
                    const targeFaceIdIndex = conflictPoitns[pointId].findIndex(conflictFaceId => conflictFaceId === faceId);
                    if (targeFaceIdIndex !== -1) {
                        conflictPoitns[pointId].splice(targeFaceIdIndex, 1);
                    }
                }
            }
            this.convexDcel.removeFaceById(faceId);
        });

        horizonHalfEdges.forEach(horizonHalfEdge => {
            const newFace = this.convexDcel.addPointByBoundary(point, horizonHalfEdge);
            this.updateConflictGraphByNeighbourFaces(horizonHalfEdge, newFace, point);
        })
        delete this.conflictGraph.points[`${point.number}`];
    }

    private updateConflictGraphByNeighbourFaces(halfEdge: IHalfEdge, face: ConvexFace, point: ConvexPoint) {
        const incidentFace = halfEdge.incidentFace;
        const incidentTwinFace =  halfEdge.twin.incidentFace;
        const incidentFaceConflicts = this.conflictGraph.faces[incidentFace.id];
        const incidentTwinFaceConflicts = this.conflictGraph.faces[incidentTwinFace.id];
        const allPointIdConflicts = incidentTwinFaceConflicts ? incidentFaceConflicts.concat(incidentTwinFaceConflicts) : incidentFaceConflicts;
        const uniquePointIdConflicts = new Set(allPointIdConflicts);

        this.updateConflictGraphByConflictIds(uniquePointIdConflicts, point, face);
    }

    private createConflictGraph(points: ConvexPoint[]) {
        points.forEach(p => this.updateConflictGraphByPoint(p));
    }

    private updateConflictGraphByPoint(point: ConvexPoint) {
        for (const faceId in this.convexDcel.faces) {
            if (this.convexDcel.faces.hasOwnProperty(faceId)) {
                // if (!faceId.includes(`${point.number}`)) {
                    const face = this.convexDcel.faces[faceId];
                    if (this.isFaceVisibleFromPoint(face, point)) {
                        // add face id to point conflict list 
                        if (this.conflictGraph.points[`${point.number}`]) {
                            this.conflictGraph.points[`${point.number}`].push(face.id);
                        } else {
                            this.conflictGraph.points[`${point.number}`] = [ face.id ];
                        }
    
                        // add point id to face conflict list 
                        if (this.conflictGraph.faces[faceId]) {
                            this.conflictGraph.faces[faceId].push(`${point.number}`);
                        } else {
                            this.conflictGraph.faces[faceId] = [ `${point.number}` ];
                        }
                    } else {
                        // console.log('the point ' + point.number + " is not visible from " + faceId )
                    }
                // }
            }
        }
    }

    private updateConflictGraphByConflictIds(pointIds: Set<string>, point: ConvexPoint, face: ConvexFace) {
        const originFacePointId = face.outerComponent.origin.id;
        const nextFacePointId = face.outerComponent.next.origin.id;
        const prevPoint = face.outerComponent.prev.origin;

        const prevFacePointId = prevPoint.id;
        const facePointPrev = prevPoint.toPoint();

        const medianPoint = this.median.getMedianPoint();
        const projectedMedian = face.projectPointOnFace(medianPoint);
        const rotAngleByY = this.findAzimuth(medianPoint.x, medianPoint.z, projectedMedian.x, projectedMedian.z);
        
        const rotatedPointProjectedMedianY = this.rotate3DPoint([projectedMedian.x, projectedMedian.y, projectedMedian.z], [medianPoint.x, medianPoint.y, medianPoint.z], rotAngleByY, [0, 1, 0])
        const rotatedPointProjectedPrevByY = this.rotate3DPoint([facePointPrev.x, facePointPrev.y, facePointPrev.z], [medianPoint.x, medianPoint.y, medianPoint.z], rotAngleByY, [0, 1, 0])
        const rotAngleX = this.findAzimuth(medianPoint.y, medianPoint.z, rotatedPointProjectedMedianY[1], rotatedPointProjectedMedianY[2], false)
        
        pointIds.forEach(pointId => {
            if (pointId !== `${point.number}`) {
                const targetPoint = this.originPoints.find(p => `${p.number}` === pointId)
                if (targetPoint) {
                    if ([originFacePointId, nextFacePointId, prevFacePointId].indexOf(pointId) === -1) {
                        if (this.isFaceVisibleAfterRotation(face, medianPoint, targetPoint, rotatedPointProjectedPrevByY, rotAngleByY, rotAngleX)) {
                            // add face id to point conflict list 
                            if (this.conflictGraph.points[`${targetPoint.number}`]) {
                                if (this.conflictGraph.points[`${targetPoint.number}`].indexOf(face.id) === -1) {
                                    this.conflictGraph.points[`${targetPoint.number}`].push(face.id);
                                }
                            } else {
                                this.conflictGraph.points[`${targetPoint.number}`] = [ face.id ];
                            }
                
                            // add point id to face conflict list 
                            if (this.conflictGraph.faces[face.id]) {
                                if (this.conflictGraph.faces[face.id].indexOf(`${targetPoint.number}`) === -1) {
                                    this.conflictGraph.faces[face.id].push(`${targetPoint.number}`);
                                }
                            } else {
                                this.conflictGraph.faces[face.id] = [ `${targetPoint.number}` ];
                            }
                        } else {
                            // console.log('the point ' + point.number + " is not visible from " + faceId )
                        }
                    }
                }
            }
        });
    }

    private isFaceVisibleFromPoint(face: ConvexFace, point: IConvexPoint) {
        const medianPoint = this.median.getMedianPoint();
        // const facePointOrigin = face.outerComponent.origin.toPoint();
        // const facePointNext = face.outerComponent.next.origin.toPoint();
        const facePointPrev = face.outerComponent.prev.origin.toPoint();

        const projectedMedian = face.projectPointOnFace(medianPoint);

        const rotAngleByY = this.findAzimuth(medianPoint.x, medianPoint.z, projectedMedian.x, projectedMedian.z);
        
        const rotatedPointProjectedMedianY = this.rotate3DPoint([projectedMedian.x, projectedMedian.y, projectedMedian.z], [medianPoint.x, medianPoint.y, medianPoint.z], rotAngleByY, [0, 1, 0])
        const rotatedPointProjectedPrevByY = this.rotate3DPoint([facePointPrev.x, facePointPrev.y, facePointPrev.z], [medianPoint.x, medianPoint.y, medianPoint.z], rotAngleByY, [0, 1, 0])
        
        
        const rotAngleX = this.findAzimuth(medianPoint.y, medianPoint.z, rotatedPointProjectedMedianY[1], rotatedPointProjectedMedianY[2], false)
        
        return this.isFaceVisibleAfterRotation(face, medianPoint, point, rotatedPointProjectedPrevByY, rotAngleByY, rotAngleX);        
    }

    private isFaceVisibleAfterRotation(face: ConvexFace, medianPoint: Point3D, point: IConvexPoint, rotatedPointProjectedPrevByY: number[], rotAngleByY: number, rotAngleX: number) {
        const rotatedTargetPointProjectedByY = this.rotate3DPoint([point.x, point.y, point.z], [medianPoint.x, medianPoint.y, medianPoint.z], rotAngleByY, [0, 1, 0])

        const rotatedPointProjectedForthX = this.rotate3DPoint(rotatedPointProjectedPrevByY, [medianPoint.x, medianPoint.y, medianPoint.z], rotAngleX, [1, 0, 0])
        const rotatedPointProjectedFifthX = this.rotate3DPoint(rotatedTargetPointProjectedByY, [medianPoint.x, medianPoint.y, medianPoint.z], rotAngleX, [1, 0, 0])

        if (rotatedPointProjectedFifthX[2].toFixed(2) == rotatedPointProjectedForthX[2].toFixed(2)) {
            console.warn("COPLANAR", `faceId: ${face.id}`, `pointNumber: ${point.number}`);
        }

        return rotatedPointProjectedFifthX[2] > rotatedPointProjectedForthX[2];
        
    }

    private getInitialPoints(points: ConvexPoint[]) {
        if (points.length > 3) {
            const pointOne = points.splice(0, 1)[0];
            const pointTwo = points.splice(0, 1)[0];
            const pointThreeIndex = points.findIndex(p => !this.arePointsInLine(pointOne, pointTwo, p));
            if (pointThreeIndex !== -1) {
                const pointThree = points.splice(pointThreeIndex, 1)[0];
                const pointFourIndex = points.findIndex(p => !this.isPointInPlane([pointOne, pointTwo, pointThree], p));
                
                if (pointFourIndex !== -1) {
                    const pointFour = points.splice(pointFourIndex, 1)[0];
                    return [ [pointOne, pointTwo, pointThree, pointFour], this.shuffle(points) ];
                }
                else {
                    //  all points are in the same plane => 2D convex hull
                    console.error('CANNOT CONSTRUCT TETRAHEDRON')
                }
                
            } else {
                // all points are in one line => 2D convex hull
                console.error('POINTS ARE IN LINE')
            }
            console.error('EMPTY DATA')
            return [ [], [] ];
        }
        else {
            console.error('EMPTY DATA')
            return [ [], [] ];
        }
    }

    public findViewDirectionVector(point: IPoint, faceOrigin: IPoint) {
        const directionVector: IPoint = {x: point.x - faceOrigin.x, y: point.y - faceOrigin.y, z: point.z - faceOrigin.z };
        return directionVector;
    }

    public getVisibility(vector1: IVector, vector2: IVector) {
        const dotProduct = vector1.dotProduct(vector2); //this.getDotProduct(vector1, vector2);
        // to do handle coplanar case - dot product equals zero
        if (dotProduct == 0) {
            console.error('COPLANAR')
        }
        return dotProduct > 0;
    }

    public getFaces() {
        let resultFaces = [];
        const faces = this.convexDcel.faces;
        for (const faceId in faces) {
            if (faces.hasOwnProperty(faceId)) {
                const outerComponent = faces[faceId].outerComponent;
                const originPoint = outerComponent.origin;
                const nextPoint = outerComponent.next.origin;
                const prevPoint = outerComponent.prev.origin;

                resultFaces.push(
                    [
                        originPoint.coordinates[0], 
                        originPoint.coordinates[1], 
                        originPoint.coordinates[2], 
                        nextPoint.coordinates[0], 
                        nextPoint.coordinates[1], 
                        nextPoint.coordinates[2], 
                        prevPoint.coordinates[0], 
                        prevPoint.coordinates[1], 
                        prevPoint.coordinates[2]
                    ]
                );
            }
        }
        return resultFaces.flat();
    }

    private getHorizonEdges(visibleFace: ConvexFace, conflictFaceIds: string[]) {
        return this.getNotVisibleNeighbourFace(visibleFace, conflictFaceIds);
    }

    private getNotVisibleNeighbourFace(face: ConvexFace, confconflictFaceIds: string[]) {
        let boundaryHalfEdges: IHalfEdge[] = [];

        const halfEdge = face.outerComponent;
        const nextHalfEdge = face.outerComponent.next;
        const prevHalfEdge = face.outerComponent.prev;

        const twinHalfEdge = halfEdge.twin;
        const twinNextHalfEdge = nextHalfEdge.twin;
        const twinPrevHalfEdge = prevHalfEdge.twin;

        if (!confconflictFaceIds.includes(twinHalfEdge.incidentFace.id)) {
            boundaryHalfEdges.push(halfEdge);
        }
        
        if (!confconflictFaceIds.includes(twinNextHalfEdge.incidentFace.id)) {
            boundaryHalfEdges.push(nextHalfEdge);
        }

        if (!confconflictFaceIds.includes(twinPrevHalfEdge.incidentFace.id)) {
            boundaryHalfEdges.push(prevHalfEdge);
        }

        return boundaryHalfEdges;
    }

    private shuffle(points: ConvexPoint[]): ConvexPoint[] {
        // Shuffle algorithm Fisher-Yates (aka Knuth) Shuffle.
        let currentIndex = points.length, randomIndex;

        // While there remain elements to shuffle.
        while (currentIndex != 0) {
          // Pick a remaining element.
          randomIndex = Math.floor(Math.random() * currentIndex);
          currentIndex--;

          // And swap it with the current element.
          [ points[currentIndex], points[randomIndex] ] = [ points[randomIndex], points[currentIndex] ];
        }

        return points;
    }

    private arePointsInLine(point1: IConvexPoint, point2: IConvexPoint, point3: IConvexPoint) {
        // If the cross product of two vectors is the zero vector, then the three points are collinear (lie on a single line)
        const normal = ConvexFace.getNormal(point1, point2, point3);
        return (normal.x == 0) && (normal.y == 0) && (normal.y == 0);
    }

    private isPointInPlane(planePoints: IConvexPoint[], point: IConvexPoint) {
        // planePoints must be an array of at least three points
        const point1 = planePoints[0];
        const point2 = planePoints[1];
        const point3 = planePoints[2];

        const normal = ConvexFace.getNormal(point1, point2, point3);

        const vector: IPoint = { x: point.x - point1.x, y: point.y - point1.y, z: point.z - point1.z  };
        
        const dotProduct = normal.dotProduct(vector); // this.getDotProduct(normal, vector);

        return dotProduct === 0;
    }

    private findAzimuth(x1: number, y1: number, x2: number, y2: number, isYAxisRotated: boolean = true) {
        // Rotate over X axis
        // positive - counter clockwise
        // negative - clockwise
    
        // Rotate over Y axis
        // positive - clockwise
        // negative - counter clockwise

        let angle = 0;
        const dY = y2 - y1;
        const dX = x2 - x1;
        const atan = Math.abs(Math.atan2(dY, dX));
        if (dX > 0 && dY > 0) {
            angle = (Math.PI / 2) - atan;
            if (isYAxisRotated) {
                angle *= -1;
            }
        }
        if (dX < 0 && dY > 0) {
            angle = atan - (Math.PI / 2);
            if (!isYAxisRotated) {
                angle *= -1;
            }
        }
        if (dX < 0 && dY < 0) {
            angle = (2 * Math.PI - atan) - Math.PI / 2;
            if (!isYAxisRotated) {
                angle *= -1;
            }
        }
        if (dX > 0 && dY < 0) {
            angle = Math.PI / 2 + atan;
            if (isYAxisRotated) {
                angle *= -1;
            }
        }
    
        return angle;
    }

    private rotate3DPoint(point: number[], origin: number[], rotationAngle: number, rotationAxis: number[]) {
        const translatedPoint = [point[0] - origin[0], point[1] - origin[1], point[2] - origin[2]];
    
        // Define the rotation axis (for example, the y-axis)
        // var rotationAxis = [0, 1, 0];
    
        // Calculate the rotation matrix
        const rotationMatrix = [
            [
                Math.cos(rotationAngle) + rotationAxis[0] * rotationAxis[0] * (1 - Math.cos(rotationAngle)),
                rotationAxis[0] * rotationAxis[1] * (1 - Math.cos(rotationAngle)) - rotationAxis[2] * Math.sin(rotationAngle),
                rotationAxis[0] * rotationAxis[2] * (1 - Math.cos(rotationAngle)) + rotationAxis[1] * Math.sin(rotationAngle)],
            [
                rotationAxis[1] * rotationAxis[0] * (1 - Math.cos(rotationAngle)) + rotationAxis[2] * Math.sin(rotationAngle),
                Math.cos(rotationAngle) + rotationAxis[1] * rotationAxis[1] * (1 - Math.cos(rotationAngle)),
                rotationAxis[1] * rotationAxis[2] * (1 - Math.cos(rotationAngle)) - rotationAxis[0] * Math.sin(rotationAngle)
            ],
            [
                rotationAxis[2] * rotationAxis[0] * (1 - Math.cos(rotationAngle)) - rotationAxis[1] * Math.sin(rotationAngle),
                rotationAxis[2] * rotationAxis[1] * (1 - Math.cos(rotationAngle)) + rotationAxis[0] * Math.sin(rotationAngle),
                Math.cos(rotationAngle) + rotationAxis[2] * rotationAxis[2] * (1 - Math.cos(rotationAngle))
            ]
        ];
    
        // Apply the rotation matrix to the translated point
        let rotatedPoint = this.multiplyMatrixVector(rotationMatrix, translatedPoint);
    
        // Translate the rotated point back to its original position
        rotatedPoint = [rotatedPoint[0] + origin[0], rotatedPoint[1] + origin[1], rotatedPoint[2] + origin[2]];
        
        return rotatedPoint;
    }
    
    private multiplyMatrixVector(matrix: number[][], vector: number[]) {
        const result = [];
        for (let i = 0; i < matrix.length; i++) {
          let sum = 0;
          for (let j = 0; j < vector.length; j++) {
            sum += matrix[i][j] * vector[j];
          }
          result.push(sum);
        }
        return result;
    }
};
