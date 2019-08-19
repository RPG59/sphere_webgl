class Shader {
    constructor(vsId, fsId) {
        const vs = this.createShader(gl.VERTEX_SHADER, vsId);
        const fs = this.createShader(gl.FRAGMENT_SHADER, fsId);

        this.program = gl.createProgram();
        gl.attachShader(this.program, vs);
        gl.attachShader(this.program, fs);
        gl.linkProgram(this.program);

        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            console.error('program link is not ok!');
            console.log(gl.getProgramInfoLog(this.program));
        }

        gl.deleteShader(vs);
        gl.deleteShader(fs);
    }

    createShader(type, id) {
        const shaderSource = document.getElementById(id).textContent;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, shaderSource);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.log('Shader compile ERROR: ');
            console.log(gl.getShaderInfoLog(shader));
            return null;
        }
        return shader;
    }

    enable() {
        gl.useProgram(this.program);
    }

    disable() {
        gl.useProgram(null);
    }
}

class float4x4 {
    constructor() {
        this.elements = new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
    }

    rotate(angle) {
        const rad = Math.PI * angle / 180;

        this.elements[0 + 0 * 4] = Math.cos(rad);
        this.elements[1 + 0 * 4] = Math.sin(rad);

        this.elements[0 + 1 * 4] = -Math.sin(rad);
        this.elements[1 + 1 * 4] = Math.cos(rad);

        return this;

    }

    lookAt(pos, at, up) {
        let zx = pos[0] - at[0];
        let zy = pos[1] - at[1];
        let zz = pos[2] - at[2];
        let zrmag = 1 / Math.sqrt((zx * zx + zy * zy + zz * zz));

        zx *= zrmag;
        zy *= zrmag;
        zz *= zrmag;

        let xx = up[1] * zz - up[2] * zy;
        let xy = up[2] * zx - up[0] * zz;
        let xz = up[0] * zy - up[1] * zx;
        let xrmag = 1 / Math.sqrt(xx * xx + xy * xy + xz * xz);

        xx *= xrmag;
        xy *= xrmag;
        xz *= xrmag;

        let yx = zy * xz - zz * xy;
        let yy = zz * xx - zx * xz;
        let yz = zx * xy - zy * xx;
        let yrmag = 1 / Math.sqrt(yx * yx + yy * yy + yz * yz);

        yx *= yrmag;
        yy *= yrmag;
        yz *= yrmag;

        this.elements[0] = xx;
        this.elements[1] = yx;
        this.elements[2] = zx;
        this.elements[3] = 0;

        this.elements[4] = xy;
        this.elements[5] = yy;
        this.elements[6] = zy;
        this.elements[7] = 0;

        this.elements[8] = xz;
        this.elements[9] = yz;
        this.elements[10] = zz;
        this.elements[11] = 0;

        this.elements[12] = -(xx * pos[0] + xy * pos[1] + xz * pos[2]);
        this.elements[13] = -(yx * pos[0] + yy * pos[1] + yz * pos[2]);
        this.elements[14] = -(zx * pos[0] + zy * pos[1] + zz * pos[2]);
        this.elements[15] = 1;

        return this;
    };
}

class VertexArray {
    constructor(vertices, indices) {
        this.vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

        this.ibo = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
        this.counter = 0;
    }

    bind() {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
    }

    unbind() {
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }

    render(count) {
        // gl.drawArrays(gl.POINTS, 0, count);
        // console.log(count);

        gl.drawElements(gl.TRIANGLE_STRIP, count, gl.UNSIGNED_SHORT, 0);
        // gl.drawElements(gl.LINE_STRIP, this.counter % count, gl.UNSIGNED_SHORT, 0);
        this.counter++;
    }

}

class PostProcess {
    constructor() {
        this.frameBuffer = gl.createFramebuffer();
        this.textureColorBuffer = gl.createTexture();
        this.rbo = gl.createRenderbuffer();

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
        gl.bindTexture(gl.TEXTURE_2D, this.textureColorBuffer);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1024, 768, 0, gl.RGB, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.textureColorBuffer, 0);

        gl.bindRenderbuffer(gl.RENDERBUFFER, this.rbo);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_STENCIL, 1024, 768);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, this.rbo);

        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
            console.error('ERROR: Framebuffer is not ok!');
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

}

function main() {
    gl.enable(gl.DEPTH_TEST);
    const sphereShader = new Shader('vs', 'fs');
    const selectedShader = new Shader('svs', 'sfs');

    const vertices = new Float32Array([
        -0.5, 0.5, 1.0,
        0.5, 0.5, 1.0,
        0.5, -0.5, 1.0,
        -0.5, -0.5, 1.0
        
    ]);

    const M = 8, N = 16;
    const sph_n = ((M + 1) * N);
    let sph_vtx = new Float32Array(3 * sph_n);

    for (let i = 0; i < M + 1; ++i) {
        const phi = i * Math.PI / M;
        const y = Math.cos(phi);
        const r = Math.sin(phi);
        for (let j = 0; j < N; ++j) {
            const th = j * 2 * Math.PI / N;
            const idx = (j + i * N) * 3;
            sph_vtx[idx] = r * Math.cos(th);
            sph_vtx[idx + 1] = y;
            sph_vtx[idx + 2] = r * Math.sin(th);

        }
    }

    const sph_in = M * (N * 2 + 2) + (M - 1) * 2;
    const sph_idx = new Uint16Array(sph_in);
    let idx = 0;
    for (let i = 0; i < M; ++i) {
        for (let j = 0; j < N; ++j) {
            sph_idx[idx++] = i * N + j;
            sph_idx[idx++] = (i + 1) * N + j;
        }
        sph_idx[idx++] = i * N;
        sph_idx[idx++] = (i + 1) * N;

        if (i < M - 1) {
            sph_idx[idx++] = (i + 1) * N + (N - 1);
            sph_idx[idx++] = (i + 1)
        }
    }


    // console.log(sph_in);
    // console.log(sph_idx);


    const projectionMatrix = float4Perspective(Math.PI / 2, gl.canvas.clientWidth / gl.canvas.clientHeight, 0.1, 100.0);
    let angle = 0;


    sphereShader.enable();


    // gl.enable(gl.BLEND);
    // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    // gl.enable(gl.CULL_FACE)
    // gl.cullFace(gl.FRONT)
    // gl.frontFace(gl.CW);


    // gl.enable(gl.CULL_FACE);
    // gl.cullFace(gl.FRONT)
    // gl.depthMask(false);
    // gl.depthFunc(gl.ALWAYS);
    // gl.enable(gl.STENCIL_TEST);

    gl.uniformMatrix4fv(gl.getUniformLocation(sphereShader.program, 'u_rtMatrix'), false, new float4x4().rotate(angle).elements);
    
    
    const postProcessing = new PostProcess();

    gl.bindFramebuffer(gl.FRAMEBUFFER, postProcessing.frameBuffer);
    
    setInterval(() => {
        const t = Date.now() / 1000;
        const c = Math.cos(t);
        const s = Math.sin(t);
        const viewMatrix = new float4x4().lookAt([2 * c, 0, 2 * s], [0, 0, 0], [0, 1, 0]);


        gl.clearColor(0, 0, 0, 1);
        //
        // gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);


        // gl.stencilFunc(gl.ALWAYS, 1, 0xFF);
        // gl.stencilMask(0xFF);
        // mesh.render(sph_in);

        // gl.stencilFunc(gl.NOTEQUAL, 1, 0xFF);
        // gl.stencilMask(0x00);
        // gl.disable(gl.DEPTH_TEST);
        gl.enable(gl.DEPTH_TEST);
        const mesh = new VertexArray(sph_vtx, sph_idx);
        sphereShader.enable();
        gl.uniformMatrix4fv(gl.getUniformLocation(sphereShader.program, 'u_viewMatrix'), false, viewMatrix.elements);
        gl.uniformMatrix4fv(gl.getUniformLocation(sphereShader.program, 'u_projMatrix'), false, projectionMatrix);
        gl.uniform1f(gl.getUniformLocation(sphereShader.program, 'z'), 0);
        mesh.render(sph_in);


        selectedShader.enable();
        gl.uniformMatrix4fv(gl.getUniformLocation(selectedShader.program, 'u_viewMatrix'), false, viewMatrix.elements);
        gl.uniformMatrix4fv(gl.getUniformLocation(selectedShader.program, 'u_projMatrix'), false, projectionMatrix);
        gl.uniform1f(gl.getUniformLocation(selectedShader.program, 'z'), 0);
        const window = new VertexArray(vertices, new Uint16Array([
            0, 1, 2,
            2, 3, 0
        ]));
        window.render(6);
        selectedShader.disable();
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.disable(gl.DEPTH_TEST);
        gl.clearColor(1, 1, 1, 1);
        

    }, 100)

}

main();

function float4Perspective(fovy, aspect, near, far) {
    const f = 1 / Math.tan(fovy / 2);
    const nf = 1 / (near - far);

    return new Float32Array([
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (far + near) * nf, -1,
        0, 0, 2 * far * near * nf, 0
    ])
}