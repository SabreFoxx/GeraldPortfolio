attribute float size;
attribute float rotationAngle;
// attribute vec3 color;
// position, normal, and uv attributes are added automatically for us when we use ShaderMaterial
// If the vertexColors property of the ShaderMaterial is set to true, the color attribute will be
// automatically added for us as well. If not, we'll have to uncomment attribute vec3 color.
// Note that the names used in BufferGeometry.addAttribute can be anything, but in this case they
// must match the names ShaderMaterial expects, for then to be added automatically.

uniform float sizeRange;

varying float vertexRotation;
varying vec3 vertexColor;

void main() {
    vertexRotation = rotationAngle;
    vertexColor = color;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    // Modify size based on position
    // Points closer to the origin will be bigger, because the length of their position vector is
    // small, and dividing a number by epsilon creates a big number. 'size' attribut is a random
    // number between 0 and 10, to add some randomness
    // To understand this, start by removing the max function and its second argument
    gl_PointSize = size * (sizeRange / (20.0 + length(mvPosition.xyz)));
    
    gl_Position = projectionMatrix * mvPosition;
}