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


class Texture {
    constructor(path) {
        this.texture = gl.createTexture();
        this.image = new Image();
        this.image.src = path;
        document.body.appendChild(this.image);
    }

    create() {
        return new Promise(res => {
            this.image.addEventListener('load', () => {
                gl.bindTexture(gl.TEXTURE_2D, this.texture);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image);
                res();
            });
        });
    }

    bind() {
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
    }

    unbind() {
        gl.bindTexture(gl.TEXTURE_2D, null);
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

    rotateFromQuatertion(quat) {
        let qx, qy, qz, qw, qx2, qy2, qz2, qxqx2, qyqy2, qzqz2, qxqy2, qyqz2, qzqw2, qxqz2, qyqw2, qxqw2;
        qx = quat.x;
        qy = quat.y;
        qz = quat.z;
        qw = quat.w;
        qx2 = (qx + qx);
        qy2 = (qy + qy);
        qz2 = (qz + qz);
        qxqx2 = (qx * qx2);
        qxqy2 = (qx * qy2);
        qxqz2 = (qx * qz2);
        qxqw2 = (qw * qx2);
        qyqy2 = (qy * qy2);
        qyqz2 = (qy * qz2);
        qyqw2 = (qw * qy2);
        qzqz2 = (qz * qz2);
        qzqw2 = (qw * qz2);

        this.elements[0] = (1 - qyqy2) - qzqz2;
        this.elements[1] = qxqy2 - qzqw2;
        this.elements[2] = qxqz2 + qyqw2;
        this.elements[3] = 0;

        this.elements[4] = qxqy2 - qzqw2;
        this.elements[5] = (1 - qxqx2) - qzqz2;
        this.elements[6] = qyqz2 - qxqw2;
        this.elements[7] = 0;

        this.elements[8] = qxqz2 - qyqw2;
        this.elements[9] = qyqz2 + qxqw2;
        this.elements[10] = (1 - qxqx2) - qyqy2;
        this.elements[11] = 0;
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

class float4 {
    constructor(x = 0, y = 0, z = 0, w = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }
}

class float3 {
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
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

function main() {
    const sphereShader = new Shader('vs', 'fs');
    const vertices = new Float32Array([
        -0.5, 0.5, 1.0,
        0.5, 0.5, 1.0,
        0.5, -0.5, 1.0,
        -0.5, -0.5, 1.0

    ]);
    // const projectionMatrix = float4Perspective(Math.PI / 2, gl.canvas.clientWidth / gl.canvas.clientHeight, 0.1, 100.0);
    let angle = 0;
    sphereShader.enable();

    gl.uniformMatrix4fv(gl.getUniformLocation(sphereShader.program, 'u_rtMatrix'), false, new float4x4().rotate(angle).elements);

    const q = new Quaternion(new float3(0, 0, 0), 10);
    console.log(q);
    const mt = new float4x4();
    mt.rotateFromQuatertion(q);
    console.log(mt);

    const vert = new Float32Array([
        -.5, -.5, 0,
        .5, -.5, 0,
        -.5, .5, 0,
        .5, .5, 0,
    ]);
    const indices = new Uint16Array([
        0, 1, 2,
        2, 3, 1
    ]);

    const mesh = new VertexArray(vert, indices);
    const proj = mat4.create();
    mat4.perspective(proj, 45, 4 / 3, 0.1, 100);
    const mtt = mat4.create();
    const qt = quat.create()
    console.log(qt);
    quat.fromEuler(qt, 45, 45, 45);
    mat4.fromQuat(mtt, qt);
    console.log(qt);
    // const mtt = mat4.
    
    gl.uniform1i(gl.getUniformLocation(sphereShader.program, 'image'), 0);


    setInterval(() => {
        const t = Date.now() / 1000;
        const c = Math.cos(t);
        const s = Math.sin(t);
        const viewMatrix = new float4x4().lookAt([2 * c, 0, 2 * s], [0, 0, 0], [0, 1, 0]);
        gl.uniformMatrix4fv(gl.getUniformLocation(sphereShader.program, 'u_viewMatrix'), false, viewMatrix.elements);
        gl.uniformMatrix4fv(gl.getUniformLocation(sphereShader.program, 'u_projMatrix'), false, proj);
        gl.uniformMatrix4fv(gl.getUniformLocation(sphereShader.program, 'u_modelMatrix'), false, mtt);
        gl.uniform1f(gl.getUniformLocation(sphereShader.program, 'z'), 0);

        gl.clearColor(0, 0, 0, .5);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        mesh.render(6);

    }, 20)

}


class Quaternion {
    constructor(vector = new float4(), a = 0) {
        a = a / 360. * Math.PI * 2;

        this.x = vector.x * Math.sin(a / 2);
        this.y = vector.y * Math.sin(a / 2);
        this.z = vector.z * Math.sin(a / 2);
        this.w = Math.cos(a / 2);
    }

    static fromEulerAngles(angles = new float3()) {
        const pitch = new Quaternion(new float3(1., 0, 0), angles.x); // тангаж
        const yaw = new Quaternion(new float3(0, 1., 0), angles.y); // рыскание
        const roll = new Quaternion(new float3(0, 0, 1.), angles.z); // крен
        return yaw.multiplyQuat(roll).multiplyQuat(pitch);
    }

    from4Coords(x, y, z, w) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
        return this;
    }

    multiplyQuat(quat) {
        const res = new Quaternion();
        return this.normalize(res.from4Coords(
            (((this.w * quat.x) + (this.x * quat.w)) + (this.y * quat.z)) - (this.z * quat.y),
            (((this.w * quat.y) + (this.y * quat.w)) + (this.z * quat.x)) - (this.x * quat.z),
            (((this.w * quat.z) + (this.z * quat.w)) + (this.x * quat.y)) - (this.y * quat.x),
            (((this.w * quat.w) + (this.x * quat.x)) + (this.y * quat.y)) - (this.z * quat.z),
        ));

    }

    multiplyScalar(scalar) {
        return new Quaternion(this.x * scalar, this.y * scalar, this.z * scalar, this.w * scalar);
    }


    normalize(quat) {
        const lenSqr = this._norm(quat);
        const lenInv = Math.sqrt(lenSqr);
        return this.multiplyScalar(lenInv);
    }

    _norm(quat) {
        let res = quat.x * quat.x;
        res += quat.y * quat.y;
        res += quat.z * quat.z;
        res += quat.w * quat.w;
        return res;
    }


}

const texture = new Texture('./1.jpg');
texture.create().then(() => {
    texture.bind();
    main();
});

// const qq = Quaternion.fromEulerAngles(new float3(90, 0, 0));

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

