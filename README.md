*What*
Collaborative 3D modeling in VR! This project builds on [Networked A-Frame](https://github.com/networked-aframe/networked-aframe) to create a 3D modeling environment.

Right now, you can make boxes. Press 'b' and then click to start drawing.


*Install*

1. `npm i`.
1. Change line 57 in "node_modules/aframe-extras/src/controls/movement-controls.js" to:
`    if (data.constrainToNavMesh !== prevData.constrainToNavMesh && el.sceneEl.systems.nav !== undefined) {`

(I think this is a bug in aframe-extras, will report.)

1. `cp types\three-core.d.ts node_modules\@types\three\`. `UniformsLib` is missing some properties. PR to DefinitelyTyped todo.
1. `npm start`. This starts the node server. To test it out, open two browser tabs and point them to `localhost:8080` or open `localhost:8080/test-2.html`. More info at [https://github.com/networked-aframe/networked-aframe](https://github.com/networked-aframe/networked-aframe).

*TODO*

1. More than one command!
1. VR interface that doesn't require the keyboard.
1. Saving, textures, object editing, audio...
