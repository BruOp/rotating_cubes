"use strict";

var cubes = new Cubes();
if (cubes.initRendererAndCheckExtensions()) {
  cubes.loadAndInitialize();
} else {
  alert("You are missing the required GL Extensions! Sorry bud")
}
