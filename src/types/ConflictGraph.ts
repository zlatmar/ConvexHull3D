type ConflictGraph = {
    points: Map<number, Set<string>>;
    faces: Map<string, Set<number>>;
};
export default ConflictGraph;
