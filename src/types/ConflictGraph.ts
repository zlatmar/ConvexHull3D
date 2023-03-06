type ConflictGraph = {
    points: {
        [pointId: string]: string[]
    },
    faces: {
        [faceId: string]: string[]
    }
};

export default ConflictGraph;
