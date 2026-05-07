const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");

let w,h,cx,cy,dpr;

function resize(){

    dpr = devicePixelRatio || 1;

    w = canvas.width = innerWidth * dpr;
    h = canvas.height = innerHeight * dpr;

    canvas.style.width = innerWidth + "px";
    canvas.style.height = innerHeight + "px";

    cx = w * .5;
    cy = h * .5;
}

window.addEventListener("resize", resize);

resize();

const EVENT_HORIZON = 120 * dpr;
const DISK_RADIUS   = 420 * dpr;

const particles = [];
const particleCount = 7000;

/*
    STAR FIELD
*/

const stars = [];

function createStars(){

    stars.length = 0;

    for(let i=0;i<1400;i++){

        stars.push({

            x:Math.random() * w,
            y:Math.random() * h,

            s:Math.random() * 2,

            a:Math.random()
        });
    }
}

createStars();

/*
    PARTICLE SYSTEM
*/

class Particle{

    constructor(){

        this.reset();
    }

    reset(){

        this.angle =
            Math.random() * Math.PI * 2;

        this.radius =
            EVENT_HORIZON +
            Math.pow(Math.random(), .65) *
            DISK_RADIUS;

        this.z =
            (Math.random() - .5) *
            180 *
            dpr;

        this.size =
            (Math.random() * 2 + .35) *
            dpr;

        this.speed =
            (.0004 + Math.random() * .0015) *
            (1.8 - this.radius / DISK_RADIUS);

        this.temp =
            1 - (this.radius / DISK_RADIUS);
    }

    update(){

        this.angle += this.speed;

        this.radius -= .02 * dpr;

        if(this.radius < EVENT_HORIZON * 1.03){

            this.reset();
        }
    }

    draw(){

        const cos = Math.cos(this.angle);
        const sin = Math.sin(this.angle);

        /*
            base disk
        */

        let x =
            cos * this.radius;

        let y =
            sin * this.radius * .22;

        /*
            disk thickness
        */

        y += this.z * .55;

        /*
            lensing distortion
        */

        const lensStrength =
            (EVENT_HORIZON * 1.4) /
            (this.radius + 80);

        x *= (1 + lensStrength * .55);

        /*
            upper arc
        */

        if(sin < 0){

            y -=
                Math.abs(sin) *
                lensStrength *
                180;
        }

        /*
            relativistic beaming
        */

        const towardViewer = cos;

        let brightness =
            towardViewer > 0
            ? 2.4
            : 0.35;

        /*
            plasma colors
        */

        let r,g,b;

        if(this.temp > .78){

            r = 220;
            g = 240;
            b = 255;

        }else if(this.temp > .5){

            r = 255;
            g = 190;
            b = 80;

        }else{

            r = 255;
            g = 90;
            b = 25;
        }

        const alpha =
            Math.min(
                1,
                (.18 + this.temp * .9)
                * brightness
            );

        ctx.beginPath();

        ctx.fillStyle =
            `rgba(${r},${g},${b},${alpha})`;

        ctx.shadowBlur =
            20 * brightness;

        ctx.shadowColor =
            `rgba(${r},${g},${b},0.9)`;

        ctx.arc(
            cx + x,
            cy + y,
            this.size,
            0,
            Math.PI * 2
        );

        ctx.fill();

        /*
            secondary lens image
        */

        if(this.radius < DISK_RADIUS * .6){

            ctx.beginPath();

            ctx.fillStyle =
                `rgba(${r},${g},${b},${alpha * .18})`;

            ctx.arc(
                cx + x,
                cy - y * .42,
                this.size * .8,
                0,
                Math.PI * 2
            );

            ctx.fill();
        }
    }
}

/*
    CREATE PARTICLES
*/

for(let i=0;i<particleCount;i++){

    particles.push(new Particle());
}

/*
    STAR RENDER
*/

function drawStars(){

    for(const s of stars){

        ctx.fillStyle =
            `rgba(255,255,255,${s.a})`;

        ctx.fillRect(
            s.x,
            s.y,
            s.s,
            s.s
        );
    }
}

/*
    MAIN LOOP
*/

function render(){

    /*
        motion blur
    */

    ctx.fillStyle =
        "rgba(0,0,0,0.08)";

    ctx.fillRect(0,0,w,h);

    drawStars();

    /*
        global glow
    */

    const glow =
        ctx.createRadialGradient(
            cx,cy,
            EVENT_HORIZON * .8,
            cx,cy,
            EVENT_HORIZON * 4
        );

    glow.addColorStop(
        0,
        "rgba(255,255,255,0.10)"
    );

    glow.addColorStop(
        .25,
        "rgba(255,170,70,0.14)"
    );

    glow.addColorStop(
        .55,
        "rgba(255,90,20,0.07)"
    );

    glow.addColorStop(
        1,
        "rgba(0,0,0,0)"
    );

    ctx.fillStyle = glow;

    ctx.beginPath();

    ctx.arc(
        cx,
        cy,
        EVENT_HORIZON * 4,
        0,
        Math.PI * 2
    );

    ctx.fill();

    /*
        accretion disk
    */

    particles.sort(
        (a,b)=>a.radius-b.radius
    );

    for(const p of particles){

        p.update();
        p.draw();
    }

    /*
        event horizon
    */

    ctx.beginPath();

    ctx.fillStyle = "#000";

    ctx.shadowBlur = 80;

    ctx.shadowColor =
        "rgba(0,0,0,1)";

    ctx.arc(
        cx,
        cy,
        EVENT_HORIZON,
        0,
        Math.PI * 2
    );

    ctx.fill();

    /*
        photon ring
    */

    const ring =
        ctx.createRadialGradient(
            cx,
            cy,
            EVENT_HORIZON * .92,
            cx,
            cy,
            EVENT_HORIZON * 1.22
        );

    ring.addColorStop(
        0,
        "rgba(255,255,255,0.95)"
    );

    ring.addColorStop(
        .3,
        "rgba(255,200,120,0.45)"
    );

    ring.addColorStop(
        1,
        "rgba(0,0,0,0)"
    );

    ctx.beginPath();

    ctx.fillStyle = ring;

    ctx.arc(
        cx,
        cy,
        EVENT_HORIZON * 1.22,
        0,
        Math.PI * 2
    );

    ctx.fill();

    /*
        camera drift
    */

    const driftX =
        Math.sin(
            performance.now() * .00012
        ) * 3;

    const driftY =
        Math.cos(
            performance.now() * .00009
        ) * 2;

    canvas.style.transform =
        `translate(${driftX}px,${driftY}px) scale(1.01)`;

    requestAnimationFrame(render);
}

ctx.fillStyle = "#000";
ctx.fillRect(0,0,w,h);

render();