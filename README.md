# ConvexHull3D

## Introduction
This project represents a solution for finding the Convex hull in 3D space of a group of points. This solution has been developed by following the Randomized incremental algorithm explained in the book [Computational Geometry (Algorithms and Application)](https://link.springer.com/book/10.1007/978-3-540-77974-2).

## Randomized Convex hull in 3D
The solution find the convex hull of points in 3D space. In order to find the convex hull, at least 4 points with three dimensional coordinates are required. The data structure that holds the Convex hull is a Doubly Connected Edge List (DCEL) that was included as a [separate GitHub project](https://github.com/zlatmar/DCEL).

##	Conflict graph
The purpose of the conflict graph is to store information about visibility from points to faces. The conflict graph is represented with bipartite graph. The bipartite graph has two nodes – one for all of the points and one for the facets of the convex hull. Each point in the node of points keeps information about all visible faces and vice versa – each face stores information about the points that are visible from the face. The conflict graph is updated every time when a point is added to the Convex hull.

## Determine the visibility between points and faces
In order to find out which faces are visible from a single point is very important. The visibility of a face from a point is determined in the following way – if the point is above the surface of the face, then the face is visible from the point and on the contrary if the point is below the surface of the face, then the face is considered as not visible from the point. In order to implement the visibility from point to a face, a helper object was added – the Median of the Convex hull.
In order to determine if a face is visible from a point, the following algorithm is used:
* Find the Median of the Convex hull;
* The Median is projected on the current face;
* The angles between the Z-axis and the line created from the median to the projected point is calculated. This angle is used for a 3D rotation. The rotation is used to rotate the target face and point in such a way that the face becomes horizontal. When the face is horizontal, the point is checked if is above or below the surface of the face, thus the face is visible or not from the point.


## Built With

The project is written mainly in TypeScript. Three.js is used for the representation of the 3D objects. Vite.js is used for a development tool.

* ![TypeScript][TypeScript]
* ![Threejs][Threejs]
* ![Vite][Vite]


## Getting Started

1. Clone this repo
```sh
   git clone --recursive https://github.com/zlatmar/ConvexHull3D.git
```
2. Install NPM packages
```sh
   npm install
```
3. Run project
```sh
   npm run dev
```

## License
Distributed under the MIT License. See LICENSE for more information.



<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[TypeScript]: https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white
[Vite]: https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white
[Threejs]: https://img.shields.io/badge/threejs-black?style=for-the-badge&logo=three.js&logoColor=white
