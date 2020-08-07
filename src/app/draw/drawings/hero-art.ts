import { DrawComponent } from '../draw.component';
import { Drawing } from '../draw-utility.service';
import { Vector3, Color, Points, ImageUtils, BufferGeometry, BufferAttribute, ShaderMaterial } from 'three';
import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass.js';

export class HeroArtDrawing implements Drawing {
    base: DrawComponent;

    geometry: BufferGeometry;
    material: ShaderMaterial;
    particles: Points;
    verticalVelocities: number[];

    setup(base: DrawComponent) {
        this.base = base;

        let amountOfParticles = 1000;
        let sizeRange = 70;

        // We will store our data here, so create arrays large enough
        let positions = new Float32Array(amountOfParticles * 3);
        let colors = new Float32Array(amountOfParticles * 3);
        let sizes = new Float32Array(amountOfParticles);
        let rotationAngles = new Float32Array(amountOfParticles);
        // Extra data that won't be sent to the GPU
        this.verticalVelocities = new Array(amountOfParticles);

        // Temporal single datum we'll use during data loading
        let vertex = new Vector3();
        let vertexColor = new Color(0xffffff);
        /* Data loading */
        let rangeX = 100;
        // Space up the points if device is portrait. Note that this isn't a responsive approach,
        // since it's done in the setup subroutine. If you scale your browser window to mobile size,
        // you'll still be using the original rangeX
        if (window.innerWidth < window.innerHeight) rangeX = 500;
        // Extra vertical range, because our veiwport and camera setup is width, but not height
        // preserving. See draw.component.ts
        let rangeY = 1000;
        for (let i = 0; i < amountOfParticles; i++) {
            vertex.x = Math.random() * rangeX - rangeX / 2;
            vertex.y = Math.random() * rangeY - rangeY / 2;
            vertex.z = 0;
            // Copy the vertex data to our array pool
            vertex.toArray(positions, i * 3);
            vertexColor.toArray(colors, i * 3);
            // Set the size
            sizes[i] = Math.random() * 9;
            // and rotation angle
            rotationAngles[i] = Math.random() * 10;
            // and the falling speed
            this.verticalVelocities[i] = 0.1 + Math.random() / 5;
        }

        this.geometry = new BufferGeometry();
        // Attach our data to the geometry
        this.geometry.setAttribute("position", new BufferAttribute(positions, 3));
        this.geometry.setAttribute("color", new BufferAttribute(colors, 3));
        this.geometry.setAttribute("size", new BufferAttribute(sizes, 1));
        this.geometry.setAttribute("rotationAngle", new BufferAttribute(rotationAngles, 1));

        this.material = new ShaderMaterial({
            /* I'm using a ShaderMaterial as opposed to a RawShaderMaterial, so GLSL code for things like opacity and depth test will be inserted for me. */
            uniforms: {
                // In our fragment shader, we'll multiple this color with our vertex color to get the output color
                generalColor: { value: new Color(0xffffff) },
                spriteTexture: { value: ImageUtils.loadTexture("assets/drawable/sprite.png") },
                sizeRange: { value: sizeRange }
            },
            vertexShader: getVertexShader(),
            fragmentShader: getFragmentShader(),
            flatShading: true,
            transparent: true, // In this scenario, helps me take advantage of textures with alpha value automatically.
            vertexColors: true // I don't really need this in a ShaderMaterial since I can do things manually. The only use is, it automatically creates the color attribute for me in my shader program.
        });

        this.particles = new Points(this.geometry, this.material);
        this.particles.name = "particles";
        this.particles.frustumCulled = true;
        base.scene.add(this.particles);
    }

    draw() {
        let glitch = new GlitchPass(0);
        glitch.enabled = true;
        this.base.composer.addPass(glitch);

        // Add an event so that when user moves his mouse or touches screen, there will be a glitch
        var disableGlitch = setTimeout(() => { // Disable glitch later. In so doing, user controls it's activation
            glitch.enabled = false;
        }, 500);
        let enableGlitch = () => {
            glitch.enabled = true;
            // Glitch is triggered whenever GlitchPass.curF % GlitchPass.randX == 0 || GlitchPass.goWild == true
            glitch.goWild = true;
            // Delay disabling of glitch since we just triggered it
            window.clearTimeout(disableGlitch);
            disableGlitch = setTimeout(() => { // A new one
                glitch.enabled = false;
            }, 100);
        }
        document.getElementById("hero").addEventListener("mousemove", enableGlitch);
        document.getElementById("hero").addEventListener("touchstart", enableGlitch);

        // Animate only after setup is complete
        this.animate();
    }

    animate = () => {
        this.base.renderer.clear();

        // Get and set data in the GPU, so we create animation
        let particlePositions = ((this.particles.geometry as BufferGeometry)
            .getAttribute("position") as BufferAttribute);
        let rotationAngle = ((this.particles.geometry as BufferGeometry)
            .getAttribute("rotationAngle") as BufferAttribute);
        for (let i = 0; i < particlePositions.count; i++) {
            // This is CPU bound. We could have also done this on the GPU
            particlePositions.setY(i, particlePositions.getY(i) - this.verticalVelocities[i]);
            if (particlePositions.getY(i) <= -100) particlePositions.setY(i, 100);
            rotationAngle.setX(i, rotationAngle.getX(i) + 0.05);
        }
        particlePositions.needsUpdate = true;
        rotationAngle.needsUpdate = true;

        requestAnimationFrame(this.animate);
        this.base.composer.render();
    };
}

let getVertexShader = () => {
    return `
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
    `
}

let getFragmentShader = () => {
    return `
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
    `
}