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
