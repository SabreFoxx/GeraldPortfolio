uniform vec3 generalColor;
uniform sampler2D spriteTexture;

varying float vertexRotation;
varying vec3 vertexColor;

void main() {
    float mid = 0.5;
    vec2 rotated = vec2(cos(vertexRotation) * (gl_PointCoord.x - mid) + sin(vertexRotation)
    * (gl_PointCoord.y - mid) + mid, cos(vertexRotation) * (gl_PointCoord.y - mid) - sin(vertexRotation)
    * (gl_PointCoord.x - mid) + mid);

    vec4 rotatedTexture = texture2D(spriteTexture, rotated);
    gl_FragColor = vec4(generalColor * vertexColor, 1.0) * rotatedTexture;
}