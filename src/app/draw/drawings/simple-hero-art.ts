import { DrawComponent } from '../draw.component';
import { Drawing } from '../draw-utility.service';
import { Geometry, PointsMaterial, Vector3, Color, Points, Texture, ImageUtils } from 'three';

class Particle extends Vector3 {
    verticalVelocity: number;
}

export class SimpleHeroArtDrawing implements Drawing {
    base: DrawComponent;

    geometry: Geometry;
    material: PointsMaterial;
    particles: Points;

    setup(base: DrawComponent) {
        this.base = base;

        let color = new Color(0xffffff);
        let texture: Texture = ImageUtils.loadTexture("assets/drawable/sprite.png");
        this.geometry = new Geometry();
        this.material = new PointsMaterial({
            size: 15,
            transparent: true,
            opacity: 0.7,
            vertexColors: true,
            sizeAttenuation: true,
            color: color, // Default value is white. This color will be multiplied with the vertex or texture color, to get the actual color
            fog: false,
            map: texture
        });

        let rangeX = 200;
        // Space up the points if device is portrait. Note that this isn't a responsive approach,
        // since it's done in the setup subroutine. If you scale your browser window to mobile size,
        // you'll still be using the original rangeX
        if (window.innerWidth < window.innerHeight) rangeX = 800;
        // Extra vertical range, because our veiwport and camera setup is width, but not height
        // preserving. See draw.component.ts
        let rangeY = 1000;
        for (var i = 0; i < 1000; i++) {
            var particle = new Particle(Math.random() * rangeX - rangeX / 2, Math.random() * rangeY - rangeY / 2, 0);
            this.geometry.vertices.push(particle);
            particle.verticalVelocity = 0.1 + Math.random() / 5;
            this.geometry.colors.push(color);
        }

        this.particles = new Points(this.geometry, this.material);
        this.particles.name = "particles";
        this.particles.frustumCulled = true;
        base.scene.add(this.particles);
    }

    draw() {
        // Animate only after setup is complete
        this.animate();
    }

    animate = () => {
        this.base.renderer.clear();

        let geometry = this.particles.geometry as Geometry;
        geometry.vertices.forEach(function (v) {
            v.y = v.y - ((v as Particle).verticalVelocity);
            if (v.y <= -100) v.y = 100;
        });
        geometry.verticesNeedUpdate = true;

        requestAnimationFrame(this.animate);
        this.base.composer.render();
    };
}
