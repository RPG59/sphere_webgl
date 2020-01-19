import * as glm from './glm.min.js';

console.log(glm);
declare const gl: WebGLRenderingContext;

class Shader {
	program: any;

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
	elements;

	constructor() {
		this.elements = new Float32Array([
			1, 0, 0, 0,
			0, 1, 0, 0,
			0, 0, 1, 0,
			0, 0, 0, 1
		]);
	}

	rotateX(angle) {
		const rad = Math.PI * angle / 180;

		this.elements[1 + 1 * 4] = Math.cos(rad);
		this.elements[2 + 1 * 4] = -Math.sin(rad);

		this.elements[1 + 2 * 4] = Math.sin(rad);
		this.elements[2 + 2 * 4] = Math.cos(rad);

		return this;
	}

	rotateY(angle) {
		const rad = Math.PI * angle / 180;

		this.elements[0 + 0 * 4] = Math.cos(rad);
		this.elements[2 + 0 * 4] = Math.sin(rad);

		this.elements[0 + 3 * 4] = -Math.sin(rad);
		this.elements[2 + 3 * 4] = Math.cos(rad);

		return this;
	}

	rotateZ(angle) {
		const rad = Math.PI * angle / 180;

		this.elements[0 + 0 * 4] = Math.cos(rad);
		this.elements[1 + 0 * 4] = Math.sin(rad);

		this.elements[0 + 1 * 4] = -Math.sin(rad);
		this.elements[1 + 1 * 4] = Math.cos(rad);

		return this;
	}

	translate(arr) {
		this.elements[0 + 3 * 4] = arr[0];
		this.elements[1 + 3 * 4] = arr[1];
		this.elements[2 + 3 * 4] = arr[2];

		return this;
	}

	scale(x, y, z) {
		this.elements[0] = x;
		this.elements[5] = y;
		this.elements[10] = z;

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

	multiply(matrix: float4x4) {
		const res = new Array(16).fill(0);

		for (let y = 0; y < 4; ++y) {
			for (let x = 0; x < 4; ++x) {
				let sum = 0;
				for (let e = 0; e < 4; ++e) {
					sum += this.elements[x + e * 4] * matrix.elements[e + y * 4];
				}
				res[x + y * 4] = sum;
			}
		}
		this.elements = new Float32Array(res);

		return this;
	}
}

class VertexArray {
	vbo;
	ibo;
	counter;

	constructor(vertices, indices, slot) {
		this.vbo = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
		gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
		gl.enableVertexAttribArray(slot);
		gl.vertexAttribPointer(slot, 3, gl.FLOAT, false, 0, 0);

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
	gl.enable(gl.DEPTH_TEST);
	const sphereShader = new Shader('vs', 'fs');
	const lightShader = new Shader('vs_lighting', 'fs_lighting');
	const skyboxShader = new Shader('vs_skybox', 'fs_skybox');
	
	let skybox_vtx = new Float32Array([
		-1.0,  1.0, -1.0,
		-1.0, -1.0, -1.0,
		1.0, -1.0, -1.0,
		1.0, -1.0, -1.0,
		1.0,  1.0, -1.0,
		-1.0,  1.0, -1.0,

		-1.0, -1.0,  1.0,
		-1.0, -1.0, -1.0,
		-1.0,  1.0, -1.0,
		-1.0,  1.0, -1.0,
		-1.0,  1.0,  1.0,
		-1.0, -1.0,  1.0,

		1.0, -1.0, -1.0,
		1.0, -1.0,  1.0,
		1.0,  1.0,  1.0,
		1.0,  1.0,  1.0,
		1.0,  1.0, -1.0,
		1.0, -1.0, -1.0,

		-1.0, -1.0,  1.0,
		-1.0,  1.0,  1.0,
		1.0,  1.0,  1.0,
		1.0,  1.0,  1.0,
		1.0, -1.0,  1.0,
		-1.0, -1.0,  1.0,

		-1.0,  1.0, -1.0,
		1.0,  1.0, -1.0,
		1.0,  1.0,  1.0,
		1.0,  1.0,  1.0,
		-1.0,  1.0,  1.0,
		-1.0,  1.0, -1.0,

		-1.0, -1.0, -1.0,
		-1.0, -1.0,  1.0,
		1.0, -1.0, -1.0,
		1.0, -1.0, -1.0,
		-1.0, -1.0,  1.0,
		1.0, -1.0,  1.0
	]);


	let sph_vtx = new Float32Array([
		-0.5, -0.5, -0.5, 0.0, 0.0, -1.0, 0.0, 0.0,
		0.5, -0.5, -0.5, 0.0, 0.0, -1.0, 1.0, 0.0,
		0.5, 0.5, -0.5, 0.0, 0.0, -1.0, 1.0, 1.0,
		0.5, 0.5, -0.5, 0.0, 0.0, -1.0, 1.0, 1.0,
		-0.5, 0.5, -0.5, 0.0, 0.0, -1.0, 0.0, 1.0,
		-0.5, -0.5, -0.5, 0.0, 0.0, -1.0, 0.0, 0.0,

		-0.5, -0.5, 0.5, 0.0, 0.0, 1.0, 0.0, 0.0,
		0.5, -0.5, 0.5, 0.0, 0.0, 1.0, 1.0, 0.0,
		0.5, 0.5, 0.5, 0.0, 0.0, 1.0, 1.0, 1.0,
		0.5, 0.5, 0.5, 0.0, 0.0, 1.0, 1.0, 1.0,
		-0.5, 0.5, 0.5, 0.0, 0.0, 1.0, 0.0, 1.0,
		-0.5, -0.5, 0.5, 0.0, 0.0, 1.0, 0.0, 0.0,

		-0.5, 0.5, 0.5, -1.0, 0.0, 0.0, 1.0, 0.0,
		-0.5, 0.5, -0.5, -1.0, 0.0, 0.0, 1.0, 1.0,
		-0.5, -0.5, -0.5, -1.0, 0.0, 0.0, 0.0, 1.0,
		-0.5, -0.5, -0.5, -1.0, 0.0, 0.0, 0.0, 1.0,
		-0.5, -0.5, 0.5, -1.0, 0.0, 0.0, 0.0, 0.0,
		-0.5, 0.5, 0.5, -1.0, 0.0, 0.0, 1.0, 0.0,

		0.5, 0.5, 0.5, 1.0, 0.0, 0.0, 1.0, 0.0,
		0.5, 0.5, -0.5, 1.0, 0.0, 0.0, 1.0, 1.0,
		0.5, -0.5, -0.5, 1.0, 0.0, 0.0, 0.0, 1.0,
		0.5, -0.5, -0.5, 1.0, 0.0, 0.0, 0.0, 1.0,
		0.5, -0.5, 0.5, 1.0, 0.0, 0.0, 0.0, 0.0,
		0.5, 0.5, 0.5, 1.0, 0.0, 0.0, 1.0, 0.0,

		-0.5, -0.5, -0.5, 0.0, -1.0, 0.0, 0.0, 1.0,
		0.5, -0.5, -0.5, 0.0, -1.0, 0.0, 1.0, 1.0,
		0.5, -0.5, 0.5, 0.0, -1.0, 0.0, 1.0, 0.0,
		0.5, -0.5, 0.5, 0.0, -1.0, 0.0, 1.0, 0.0,
		-0.5, -0.5, 0.5, 0.0, -1.0, 0.0, 0.0, 0.0,
		-0.5, -0.5, -0.5, 0.0, -1.0, 0.0, 0.0, 1.0,

		-0.5, 0.5, -0.5, 0.0, 1.0, 0.0, 0.0, 1.0,
		0.5, 0.5, -0.5, 0.0, 1.0, 0.0, 1.0, 1.0,
		0.5, 0.5, 0.5, 0.0, 1.0, 0.0, 1.0, 0.0,
		0.5, 0.5, 0.5, 0.0, 1.0, 0.0, 1.0, 0.0,
		-0.5, 0.5, 0.5, 0.0, 1.0, 0.0, 0.0, 0.0,
		-0.5, 0.5, -0.5, 0.0, 1.0, 0.0, 0.0, 1.0
	]);

	// @ts-ignore
	// const projectionMatrix = float4Perspective(
	// 	Math.PI / 2, gl.canvas.clientWidth / gl.canvas.clientHeight, 0.1, 100.0
	// );

	const projectionMatrix = new Float32Array(new Array(16).fill(0));

	glm.mat4.perspective(projectionMatrix, Math.PI / 4, gl.canvas.clientWidth / gl.canvas.clientHeight, .1, 100.);
	
	const buff1 = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buff1);
	gl.bufferData(gl.ARRAY_BUFFER, sph_vtx, gl.STATIC_DRAW);
	gl.enableVertexAttribArray(0);
	gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 8 * 4, 0);
	gl.enableVertexAttribArray(1);
	gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 8 * 4, 3 * 4);
	gl.enableVertexAttribArray(2);
	gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 8 * 4, 6 * 4);
	
	const skyboxBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, skyboxBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, skybox_vtx, gl.STATIC_DRAW);
	gl.enableVertexAttribArray(3);
	gl.vertexAttribPointer(3, 3, gl.FLOAT, false, 0, 0);


	// const modelMatrix = new Float32Array(new Array(16).fill(0));
	// modelMatrix[0] = .1;
	// modelMatrix[5] = .1;
	// modelMatrix[10] = 1;
	// modelMatrix[15] = 1;


	// glm.mat4.scale(modelMatrix, new Float32Array(new Array(16).fill(0)))

	const lightPosition = [1.5, 0, 0];
	sphereShader.enable();


	gl.uniform1i(gl.getUniformLocation(sphereShader.program, 'material.diffuse'), 2);
	gl.uniform1i(gl.getUniformLocation(sphereShader.program, 'material.specular'), 3);
	gl.uniform1f(gl.getUniformLocation(sphereShader.program, 'material.shininess'), 32.);

	gl.uniform3fv(gl.getUniformLocation(sphereShader.program, 'light.position'), lightPosition);
	gl.uniform3f(gl.getUniformLocation(sphereShader.program, 'light.ambient'), .3, .2, .1);
	gl.uniform3f(gl.getUniformLocation(sphereShader.program, 'light.diffuse'), .5, .7, .1);
	gl.uniform3f(gl.getUniformLocation(sphereShader.program, 'light.specular'), 1., 1., 1.);
	gl.uniform1f(gl.getUniformLocation(sphereShader.program, 'light.constant'), 1.);
	gl.uniform1f(gl.getUniformLocation(sphereShader.program, 'light.linear'), .045);
	gl.uniform1f(gl.getUniformLocation(sphereShader.program, 'light.quadratic'), .0075);

	gl.uniform1f(gl.getUniformLocation(sphereShader.program, 'spotlight.cutOff'), Math.cos(Math.PI / 8));
	gl.uniform3fv(gl.getUniformLocation(sphereShader.program, 'spotlight.direction'), lightPosition);
	gl.enable(gl.DEPTH_TEST);

	const render = () => {
		sphereShader.enable();
		const t = Date.now() / 1000;
		// const t = 6.2;
		const c = Math.cos(t);
		const s = Math.sin(t);


		const tmpMat2 = new float4x4().translate(lightPosition);

		// const lightModelMatrix = new float4x4().scale(.1, .1, .1).multiply(tmpMat2);
		const lightModelMatrix = new float4x4().translate(lightPosition).multiply(new float4x4().scale(.1, .1, .1));
		const cameraPosition = [2* c , 0, 2 *s ];
		// const cameraPosition = [0, 1, 2];
		const viewMatrix = new float4x4().lookAt(cameraPosition, [0, 0, 0], [0, 1, 0]);
		// const viewMatrix = new float4x4().lookAt([2*Math.sin(1), 1, 2*Math.cos(1)], [0,0,0], [0, 1, 0]);

		// const viewMatrix = new Float32Array(new Array(16).fill(0));
		// glm.mat4.lookAt(
		// 	viewMatrix,
		// 	new Float32Array([2*c, 0, 2*s]),
		// 	new Float32Array([0, 0, 0]),
		// 	new Float32Array([0, 0, -1]),n
		// 	new Float32Array([0, 1, 0])
		// );
		const modelMatrix = new float4x4();
		modelMatrix.scale(.5, .5, .5);
		const skyboxModelMatrix = new float4x4();
		skyboxModelMatrix.scale(2, 2, 2)

		gl.clearColor(0, 0, 0, 1);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);

		
		sphereShader.enable();
		gl.uniformMatrix4fv(gl.getUniformLocation(sphereShader.program, 'u_viewMatrix'), false, viewMatrix.elements);
		gl.uniformMatrix4fv(gl.getUniformLocation(sphereShader.program, 'u_projMatrix'), false, projectionMatrix);
		gl.uniformMatrix4fv(gl.getUniformLocation(sphereShader.program, 'u_modelMatrix'), false, modelMatrix.elements);

		gl.uniform3fv(gl.getUniformLocation(sphereShader.program, 'objectColor'), new Float32Array([1., .5, .31]));
		gl.uniform3fv(gl.getUniformLocation(sphereShader.program, 'lightPos'), new Float32Array(lightPosition));
		gl.uniform3fv(gl.getUniformLocation(sphereShader.program, 'viewPos'), new Float32Array(cameraPosition));

		gl.drawArrays(gl.TRIANGLES, 0, 35);
		
		gl.depthFunc(gl.LEQUAL)
		skyboxShader.enable();
		gl.uniformMatrix4fv(gl.getUniformLocation(skyboxShader.program, 'u_viewMatrix'), false, viewMatrix.elements);
		gl.uniformMatrix4fv(gl.getUniformLocation(skyboxShader.program, 'u_projMatrix'), false, projectionMatrix);
		gl.uniformMatrix4fv(gl.getUniformLocation(skyboxShader.program, 'u_modelMatrix'), false, skyboxModelMatrix.elements);
		gl.drawArrays(gl.TRIANGLES, 0, 36);
		gl.depthFunc(gl.LESS);

		// lightShader.enable();
		// gl.uniformMatrix4fv(gl.getUniformLocation(lightShader.program, 'u_viewMatrix'), false, viewMatrix.elements);
		// gl.uniformMatrix4fv(gl.getUniformLocation(lightShader.program, 'u_projMatrix'), false, projectionMatrix);
		// gl.uniformMatrix4fv(gl.getUniformLocation(lightShader.program, 'u_modelMatrix'), false, lightModelMatrix.elements);
		// gl.drawArrays(gl.TRIANGLES, 0, 36);
		
		
		requestAnimationFrame(render)
	}


	render();


}

(async () => {
	const texture1 = await creatTexture('SpecularMap.png');
	const texture2 = await creatTexture('NormalMap (2).png');
	const texture3 = await creatTexture('container2.png');
	const texture4 = await creatTexture('container2_specular.png');
	const cubemap1 = await createCubemap([
		"cubemap/right.jpg",
		"cubemap/left.jpg",
		"cubemap/top.jpg",
		"cubemap/bottom.jpg",
		"cubemap/front.jpg",
		"cubemap/back.jpg"
	]);

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, texture1);
	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, texture2);
	gl.activeTexture(gl.TEXTURE2);
	gl.bindTexture(gl.TEXTURE_2D, texture3);
	gl.activeTexture(gl.TEXTURE3);
	gl.bindTexture(gl.TEXTURE_2D, texture4);
	// gl.activeTexture(gl.TEXTURE4);
	// gl.bindTexture(gl.TEXTURE4, cubemap1);
	main();
})();

async function createCubemap(paths: string[]): Promise<WebGLTexture> {
	return new Promise(res => {
		const texture = gl.createTexture();
		const imgs: any = new Array(6).fill(0).map(x => new Image());
		const promises = [];

		imgs.forEach((img, i) => {
			img.src = paths[i];
			const promise = new Promise(res => {
				img.onload = () => {
					res();
				}
			});
			promises.push(promise);
		});

		Promise.all(promises).then(() => {
			gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
			
			paths.forEach((path, i) => {
				gl.texImage2D(
					gl.TEXTURE_CUBE_MAP_POSITIVE_X + i,
					0,
					gl.RGB,
					gl.RGB,
					gl.UNSIGNED_BYTE,
					imgs[i]
				);
			});

			gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			// @ts-ignore
			gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
			
			res(texture);
		});

	});
}


async function creatTexture(path): Promise<WebGLTexture> {
	return new Promise(res => {
		const texture = gl.createTexture();
		const img = new Image();

		img.src = path;
		img.onload = () => {
			gl.bindTexture(gl.TEXTURE_2D, texture);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

			res(texture);
		}
	})
}

function float4Perspective(fovy, aspect, near, far) {
	const f = 1 / Math.tan(fovy / 2);
	const nf = 1 / (near - far);

	return new Float32Array([
		f / aspect, 0, 0, 0,
		0, , 0, 0,
		0, 0, (far + near) * nf, -1,
		0, 0, 2 * far * near * nf, 0
	])
}

