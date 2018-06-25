## What
Collaborative 3D modeling in VR! This project builds on [Networked A-Frame](https://github.com/networked-aframe/networked-aframe) to create a 3D modeling environment.

Right now, you can make boxes. Press 'b' and then click to start drawing. WASD to move around.

![Demo GIF](https://raw.githubusercontent.com/twastvedt/Colab-VR/master/docs/demo.gif)

Try it out here: https://colab-vr.herokuapp.com/ (Running on a free server, so there may be a startup delay since the server goes to sleep.)

## Install

1. `npm i` (postinstall copies two files into node_modules to correct errors. Reports/PRs have been made!)
1. `npm start`. This starts the node server. To test it out, open two browser tabs and point them to `localhost:8080` or open `localhost:8080/test-2.html`. More info at [https://github.com/networked-aframe/networked-aframe](https://github.com/networked-aframe/networked-aframe).

## TODO

1. More than one command!
1. VR interface that doesn't require the keyboard.
1. Saving, textures, object editing, audio...


## Tooling

### stringify

Currently using stringify to import glsl files as strings for three.js. We can't use glslify, I think, because it uses acorn to transform javascript files. Acorn can't handle typescript, and I don't think there's a way to make the glslify transform run after the tsify plugin. All glslify was doing though was importing a glsl file as a string, so stringify should do the trick. This means we can't take advantage of any of the other glslify plugins, but haven't needed to do that yet. Alternatively, webpack might work, or Parcel once they get source-maps working with [pre-transformed code](https://github.com/parcel-bundler/parcel/issues/741#issuecomment-398961808).
