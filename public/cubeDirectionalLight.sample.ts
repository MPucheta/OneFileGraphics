// @ts-nocheck

const degToRad = (d) => (d * Math.PI) / 180;

function setupGUIControls () {
  const controls = {
    rotation: [degToRad(0), degToRad(0), degToRad(0)],
    scale: [25, 25, 25],
    lightScale: [2, 2, 2],
    lightPosition: [50, 100, 50]
  };

  const gui = new window.GUI();

  gui.add(controls.rotation, '0', -360, 360).name("object rotation x");
  gui.add(controls.rotation, '1', -360, 360).name("object rotation y");
  gui.add(controls.rotation, '2', -360, 360).name("object rotation z");

  gui.add(controls.lightPosition, '0', -600, 600).name("light position x");
  gui.add(controls.lightPosition, '1', -600, 600).name("light position y");
  gui.add(controls.lightPosition, '2', -600, 600).name("light position z");

  return controls;
}

const controls = setupGUIControls();

async function main () {
  const canvas = document.getElementById('3dCanvas');

  const gpu = navigator.gpu;

  assert(gpu);

  const adapter = await gpu.requestAdapter();

  assert(adapter);

  const device = await adapter.requestDevice();

  assert(device);

  const context = canvas.getContext('webgpu');

  assert(context);

  const format = gpu.getPreferredCanvasFormat();

  context.configure({
    device,
    format,
    alphaMode: 'premultiplied',
  });

  const shaderModule = device.createShaderModule({
    label: 'shader',
    code: `
           struct Uniforms {
             normalMatrix: mat3x3f,
             worldViewProjection: mat4x4f,
             color: vec4f,
             lightPosition: vec3f
            }

            struct VSOutput {
                @builtin(position) position: vec4f,
                @location(0) normal: vec3f,
            }

            struct Vertex {
                @location(0) position: vec4f,
                @location(1) normal: vec3f,
           }

           @group(0) @binding(0) var<uniform> uni: Uniforms;

           @vertex
           fn v_main(
           vert: Vertex,
           ) -> VSOutput{
              var vsOut: VSOutput;

              vsOut.position = uni.worldViewProjection * vert.position;

              // orient normals regarding world/normalMatrix
              vsOut.normal = uni.normalMatrix * vert.normal; 

              return vsOut;
           }

           @fragment
           fn f_main(vsOut: VSOutput) -> @location(0) vec4f {
                let normal = normalize(vsOut.normal);
                let lightDirection = normalize(uni.lightPosition);

                // bit of a hack, light has no alpha so we render it without being affected by color calcs
                if (uni.color.a < 1.0) {
                    return uni.color;
                }

                let light = dot(normal, lightDirection);

                let color = uni.color.rgb * light;

                return vec4f(color, uni.color.a);
           }
        `,
  });

  const pipelineDescriptor = {
    vertex: {
      module: shaderModule,
      entryPoint: 'v_main',
      buffers: [
        {
          arrayStride: (3 + 3) * 4,
          attributes: [
            { shaderLocation: 0, offset: 0, format: 'float32x3' },
            { shaderLocation: 1, offset: 12, format: 'float32x3' }, //normal vector
          ],
        },
      ],
    },
    fragment: {
      module: shaderModule,
      entryPoint: 'f_main',
      targets: [{ format }],
    },
    layout: 'auto',
    primitive: {
      cullMode: 'back',
    },
    depthStencil: {
      depthWriteEnabled: true,
      depthCompare: 'less',
      format: 'depth24plus',
    },
  };

  const pipeline = device.createRenderPipeline(pipelineDescriptor);

  const { vertexData, numVertices } = createCubeVertices();

  const vertexBuffer = device.createBuffer({
    label: 'vertex buffer',
    size: vertexData.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });

  device.queue.writeBuffer(vertexBuffer, 0, vertexData);

  function allocMemoryForObject () {
    const objectInfos = [];

    const unifromBufferSize = (12 + 16 + 4 + 4) * 4; //world matrix +  world project + color + lightPosition aligned
    const uniformBuffer = device.createBuffer({
      label: 'uni',
      size: unifromBufferSize,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const uniformValues = new Float32Array(unifromBufferSize / 4);

    const kWorldOffset = 0;
    const kWorldViewProjectionOffset = 12;
    const kColorOffset = 28;
    const kLightDirectionOffset = 32;

    const normalMatrixValue = uniformValues.subarray(
      kWorldOffset,
      kWorldOffset + 12
    );

    const worldViewProjectionValue = uniformValues.subarray(
      kWorldViewProjectionOffset,
      kWorldViewProjectionOffset + 16
    );

    const colorValue = uniformValues.subarray(
      kColorOffset,
      kColorOffset + 4
    );

    const lightDirectionValue = uniformValues.subarray(
      kLightDirectionOffset,
      kLightDirectionOffset + 3
    );

    const bindGroup = device.createBindGroup({
      label: 'bind group',
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: {
            buffer: uniformBuffer,
          },
        },
      ],
    });

    objectInfos.push({
      uniformBuffer,
      uniformValues,
      bindGroup,
      normalMatrixValue,
      worldViewProjectionValue,
      colorValue,
      lightDirectionValue
    });

    return objectInfos;
  }

  const objectInfos = allocMemoryForObject();
  const lightInfo = allocMemoryForObject();

  function render (timestamp) {
    const encoder = device.createCommandEncoder();
    const texture = context.getCurrentTexture();

    const renderPassDescriptor = {
      label: 'canvas render pass',
      colorAttachments: [
        {
          loadOp: 'clear',
          storeOp: 'store',
          view: texture.createView(),
        },
      ],
      depthStencilAttachment: {
        depthClearValue: 1.0,
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
      },
    };

    const canvasTexture = texture;

    const depthTexture = device.createTexture({
      size: [canvasTexture.width, canvasTexture.height],
      format: 'depth24plus',
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });

    renderPassDescriptor.depthStencilAttachment.view =
      depthTexture.createView();

    const renderPass = encoder.beginRenderPass(renderPassDescriptor);
    renderPass.setPipeline(pipeline);
    renderPass.setVertexBuffer(0, vertexBuffer); // actual vertex data


    function positionCameraLookingAtScene () {
      const eye = [100, 150, 200];
      const target = [0, 35, 0];
      const up = [0, 1, 0];
      const aspect = canvas.clientWidth / canvas.clientHeight;
      const projection = VectorMath.mat4.perspective(
        degToRad(60),
        aspect,
        1,
        2000,
      );

      const sceneViewMatrix = VectorMath.mat4.lookAt(eye, target, up);
      const sceneViewProjectionMatrix = VectorMath.mat4.multiply(projection, sceneViewMatrix);

      return sceneViewProjectionMatrix;
    }

    const sceneViewProjectionMatrix = positionCameraLookingAtScene()

    for (const objInfo of objectInfos) {
      const { uniformBuffer, uniformValues, bindGroup, colorValue, lightDirectionValue, normalMatrixValue, worldViewProjectionValue } = objInfo;

      const world = VectorMath.mat4.rotationY(controls.rotation[0] * 0.01);
      VectorMath.mat4.rotateX(world, controls.rotation[1] * 0.01, world);
      VectorMath.mat4.rotateZ(world, controls.rotation[2] * 0.01, world);

      VectorMath.mat4.multiply(sceneViewProjectionMatrix, world, worldViewProjectionValue);
      VectorMath.mat4.scale(worldViewProjectionValue, controls.scale, worldViewProjectionValue);

      VectorMath.mat3.fromMat4(VectorMath.mat4.transpose(VectorMath.mat4.inverse(world)), normalMatrixValue)

      const GREEN = [0.2, 1, 0.2, 1];
      colorValue.set(GREEN);
      lightDirectionValue.set(VectorMath.vec3.normalize(controls.lightPosition));

      device.queue.writeBuffer(uniformBuffer, 0, uniformValues);
      renderPass.setBindGroup(0, bindGroup);
      renderPass.draw(numVertices);
    }

    for (const objInfo of lightInfo) {
      const { uniformBuffer, uniformValues, bindGroup, colorValue, lightDirectionValue, normalMatrixValue, worldViewProjectionValue } = objInfo;

      const normalMatrix = VectorMath.mat4.translation(controls.lightPosition)

      VectorMath.mat4.multiply(sceneViewProjectionMatrix, normalMatrix, worldViewProjectionValue);
      VectorMath.mat4.scale(worldViewProjectionValue, controls.lightScale, worldViewProjectionValue);

      VectorMath.mat3.fromMat4(VectorMath.mat4.transpose(VectorMath.mat4.inverse(normalMatrix)), normalMatrixValue)

      const WHITE = [1, 1, 1, 0];
      colorValue.set(WHITE);
      lightDirectionValue.set(VectorMath.vec3.normalize(controls.lightPosition));

      device.queue.writeBuffer(uniformBuffer, 0, uniformValues);
      renderPass.setBindGroup(0, bindGroup);
      renderPass.draw(numVertices);
    }

    renderPass.end();
    device.queue.submit([encoder.finish()]);

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

const VectorMath = {
  mat4: {
    transpose (m, dst) {
      dst = dst || new Float32Array(16);

      dst[0] = m[0]; dst[1] = m[4]; dst[2] = m[8]; dst[3] = m[12];
      dst[4] = m[1]; dst[5] = m[5]; dst[6] = m[9]; dst[7] = m[13];
      dst[8] = m[2]; dst[9] = m[6]; dst[10] = m[10]; dst[11] = m[14];
      dst[12] = m[3]; dst[13] = m[7]; dst[14] = m[11]; dst[15] = m[15];

      return dst;
    },
    projection (width, height, depth, dst) {
      return VectorMath.mat4.ortho(0, width, height, 0, depth, -depth, dst);
    },

    perspective (fieldOfViewYInRadians, aspect, zNear, zFar, dst) {
      dst = dst || new Float32Array(16);

      const f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewYInRadians);
      const rangeInv = 1 / (zNear - zFar);

      dst[0] = f / aspect;
      dst[1] = 0;
      dst[2] = 0;
      dst[3] = 0;

      dst[4] = 0;
      dst[5] = f;
      dst[6] = 0;
      dst[7] = 0;

      dst[8] = 0;
      dst[9] = 0;
      dst[10] = zFar * rangeInv;
      dst[11] = -1;

      dst[12] = 0;
      dst[13] = 0;
      dst[14] = zNear * zFar * rangeInv;
      dst[15] = 0;

      return dst;
    },

    ortho (left, right, bottom, top, near, far, dst) {
      dst = dst || new Float32Array(16);

      dst[0] = 2 / (right - left);
      dst[1] = 0;
      dst[2] = 0;
      dst[3] = 0;

      dst[4] = 0;
      dst[5] = 2 / (top - bottom);
      dst[6] = 0;
      dst[7] = 0;

      dst[8] = 0;
      dst[9] = 0;
      dst[10] = 1 / (near - far);
      dst[11] = 0;

      dst[12] = (right + left) / (left - right);
      dst[13] = (top + bottom) / (bottom - top);
      dst[14] = near / (near - far);
      dst[15] = 1;

      return dst;
    },

    identity (dst) {
      dst = dst || new Float32Array(16);
      dst[0] = 1; dst[1] = 0; dst[2] = 0; dst[3] = 0;
      dst[4] = 0; dst[5] = 1; dst[6] = 0; dst[7] = 0;
      dst[8] = 0; dst[9] = 0; dst[10] = 1; dst[11] = 0;
      dst[12] = 0; dst[13] = 0; dst[14] = 0; dst[15] = 1;
      return dst;
    },

    multiply (a, b, dst) {
      dst = dst || new Float32Array(16);
      const b00 = b[0 * 4 + 0];
      const b01 = b[0 * 4 + 1];
      const b02 = b[0 * 4 + 2];
      const b03 = b[0 * 4 + 3];
      const b10 = b[1 * 4 + 0];
      const b11 = b[1 * 4 + 1];
      const b12 = b[1 * 4 + 2];
      const b13 = b[1 * 4 + 3];
      const b20 = b[2 * 4 + 0];
      const b21 = b[2 * 4 + 1];
      const b22 = b[2 * 4 + 2];
      const b23 = b[2 * 4 + 3];
      const b30 = b[3 * 4 + 0];
      const b31 = b[3 * 4 + 1];
      const b32 = b[3 * 4 + 2];
      const b33 = b[3 * 4 + 3];
      const a00 = a[0 * 4 + 0];
      const a01 = a[0 * 4 + 1];
      const a02 = a[0 * 4 + 2];
      const a03 = a[0 * 4 + 3];
      const a10 = a[1 * 4 + 0];
      const a11 = a[1 * 4 + 1];
      const a12 = a[1 * 4 + 2];
      const a13 = a[1 * 4 + 3];
      const a20 = a[2 * 4 + 0];
      const a21 = a[2 * 4 + 1];
      const a22 = a[2 * 4 + 2];
      const a23 = a[2 * 4 + 3];
      const a30 = a[3 * 4 + 0];
      const a31 = a[3 * 4 + 1];
      const a32 = a[3 * 4 + 2];
      const a33 = a[3 * 4 + 3];

      dst[0] = b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30;
      dst[1] = b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31;
      dst[2] = b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32;
      dst[3] = b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33;

      dst[4] = b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30;
      dst[5] = b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31;
      dst[6] = b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32;
      dst[7] = b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33;

      dst[8] = b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30;
      dst[9] = b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31;
      dst[10] = b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32;
      dst[11] = b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33;

      dst[12] = b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30;
      dst[13] = b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31;
      dst[14] = b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32;
      dst[15] = b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33;

      return dst;
    },

    inverse (m, dst) {
      dst = dst || new Float32Array(16);

      const m00 = m[0 * 4 + 0];
      const m01 = m[0 * 4 + 1];
      const m02 = m[0 * 4 + 2];
      const m03 = m[0 * 4 + 3];
      const m10 = m[1 * 4 + 0];
      const m11 = m[1 * 4 + 1];
      const m12 = m[1 * 4 + 2];
      const m13 = m[1 * 4 + 3];
      const m20 = m[2 * 4 + 0];
      const m21 = m[2 * 4 + 1];
      const m22 = m[2 * 4 + 2];
      const m23 = m[2 * 4 + 3];
      const m30 = m[3 * 4 + 0];
      const m31 = m[3 * 4 + 1];
      const m32 = m[3 * 4 + 2];
      const m33 = m[3 * 4 + 3];

      const tmp0 = m22 * m33;
      const tmp1 = m32 * m23;
      const tmp2 = m12 * m33;
      const tmp3 = m32 * m13;
      const tmp4 = m12 * m23;
      const tmp5 = m22 * m13;
      const tmp6 = m02 * m33;
      const tmp7 = m32 * m03;
      const tmp8 = m02 * m23;
      const tmp9 = m22 * m03;
      const tmp10 = m02 * m13;
      const tmp11 = m12 * m03;
      const tmp12 = m20 * m31;
      const tmp13 = m30 * m21;
      const tmp14 = m10 * m31;
      const tmp15 = m30 * m11;
      const tmp16 = m10 * m21;
      const tmp17 = m20 * m11;
      const tmp18 = m00 * m31;
      const tmp19 = m30 * m01;
      const tmp20 = m00 * m21;
      const tmp21 = m20 * m01;
      const tmp22 = m00 * m11;
      const tmp23 = m10 * m01;

      const t0 = (tmp0 * m11 + tmp3 * m21 + tmp4 * m31) -
        (tmp1 * m11 + tmp2 * m21 + tmp5 * m31);
      const t1 = (tmp1 * m01 + tmp6 * m21 + tmp9 * m31) -
        (tmp0 * m01 + tmp7 * m21 + tmp8 * m31);
      const t2 = (tmp2 * m01 + tmp7 * m11 + tmp10 * m31) -
        (tmp3 * m01 + tmp6 * m11 + tmp11 * m31);
      const t3 = (tmp5 * m01 + tmp8 * m11 + tmp11 * m21) -
        (tmp4 * m01 + tmp9 * m11 + tmp10 * m21);

      const d = 1 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3);

      dst[0] = d * t0;
      dst[1] = d * t1;
      dst[2] = d * t2;
      dst[3] = d * t3;

      dst[4] = d * ((tmp1 * m10 + tmp2 * m20 + tmp5 * m30) -
        (tmp0 * m10 + tmp3 * m20 + tmp4 * m30));
      dst[5] = d * ((tmp0 * m00 + tmp7 * m20 + tmp8 * m30) -
        (tmp1 * m00 + tmp6 * m20 + tmp9 * m30));
      dst[6] = d * ((tmp3 * m00 + tmp6 * m10 + tmp11 * m30) -
        (tmp2 * m00 + tmp7 * m10 + tmp10 * m30));
      dst[7] = d * ((tmp4 * m00 + tmp9 * m10 + tmp10 * m20) -
        (tmp5 * m00 + tmp8 * m10 + tmp11 * m20));

      dst[8] = d * ((tmp12 * m13 + tmp15 * m23 + tmp16 * m33) -
        (tmp13 * m13 + tmp14 * m23 + tmp17 * m33));
      dst[9] = d * ((tmp13 * m03 + tmp18 * m23 + tmp21 * m33) -
        (tmp12 * m03 + tmp19 * m23 + tmp20 * m33));
      dst[10] = d * ((tmp14 * m03 + tmp19 * m13 + tmp22 * m33) -
        (tmp15 * m03 + tmp18 * m13 + tmp23 * m33));
      dst[11] = d * ((tmp17 * m03 + tmp20 * m13 + tmp23 * m23) -
        (tmp16 * m03 + tmp21 * m13 + tmp22 * m23));

      dst[12] = d * ((tmp14 * m22 + tmp17 * m32 + tmp13 * m12) -
        (tmp16 * m32 + tmp12 * m12 + tmp15 * m22));
      dst[13] = d * ((tmp20 * m32 + tmp12 * m02 + tmp19 * m22) -
        (tmp18 * m22 + tmp21 * m32 + tmp13 * m02));
      dst[14] = d * ((tmp18 * m12 + tmp23 * m32 + tmp15 * m02) -
        (tmp22 * m32 + tmp14 * m02 + tmp19 * m12));
      dst[15] = d * ((tmp22 * m22 + tmp16 * m02 + tmp21 * m12) -
        (tmp20 * m12 + tmp23 * m22 + tmp17 * m02));
      return dst;
    },

    cameraAim (eye, target, up, dst) {
      dst = dst || new Float32Array(16);

      const zAxis = VectorMath.vec3.normalize(VectorMath.vec3.subtract(eye, target));
      const xAxis = VectorMath.vec3.normalize(VectorMath.vec3.cross(up, zAxis));
      const yAxis = VectorMath.vec3.normalize(VectorMath.vec3.cross(zAxis, xAxis));

      dst[0] = xAxis[0]; dst[1] = xAxis[1]; dst[2] = xAxis[2]; dst[3] = 0;
      dst[4] = yAxis[0]; dst[5] = yAxis[1]; dst[6] = yAxis[2]; dst[7] = 0;
      dst[8] = zAxis[0]; dst[9] = zAxis[1]; dst[10] = zAxis[2]; dst[11] = 0;
      dst[12] = eye[0]; dst[13] = eye[1]; dst[14] = eye[2]; dst[15] = 1;

      return dst;
    },

    lookAt (eye, target, up, dst) {
      return VectorMath.mat4.inverse(VectorMath.mat4.cameraAim(eye, target, up, dst), dst);
    },

    translation ([tx, ty, tz], dst) {
      dst = dst || new Float32Array(16);
      dst[0] = 1; dst[1] = 0; dst[2] = 0; dst[3] = 0;
      dst[4] = 0; dst[5] = 1; dst[6] = 0; dst[7] = 0;
      dst[8] = 0; dst[9] = 0; dst[10] = 1; dst[11] = 0;
      dst[12] = tx; dst[13] = ty; dst[14] = tz; dst[15] = 1;
      return dst;
    },

    rotationX (angleInRadians, dst) {
      const c = Math.cos(angleInRadians);
      const s = Math.sin(angleInRadians);
      dst = dst || new Float32Array(16);
      dst[0] = 1; dst[1] = 0; dst[2] = 0; dst[3] = 0;
      dst[4] = 0; dst[5] = c; dst[6] = s; dst[7] = 0;
      dst[8] = 0; dst[9] = -s; dst[10] = c; dst[11] = 0;
      dst[12] = 0; dst[13] = 0; dst[14] = 0; dst[15] = 1;
      return dst;
    },

    rotationY (angleInRadians, dst) {
      const c = Math.cos(angleInRadians);
      const s = Math.sin(angleInRadians);
      dst = dst || new Float32Array(16);
      dst[0] = c; dst[1] = 0; dst[2] = -s; dst[3] = 0;
      dst[4] = 0; dst[5] = 1; dst[6] = 0; dst[7] = 0;
      dst[8] = s; dst[9] = 0; dst[10] = c; dst[11] = 0;
      dst[12] = 0; dst[13] = 0; dst[14] = 0; dst[15] = 1;
      return dst;
    },

    rotationZ (angleInRadians, dst) {
      const c = Math.cos(angleInRadians);
      const s = Math.sin(angleInRadians);
      dst = dst || new Float32Array(16);
      dst[0] = c; dst[1] = s; dst[2] = 0; dst[3] = 0;
      dst[4] = -s; dst[5] = c; dst[6] = 0; dst[7] = 0;
      dst[8] = 0; dst[9] = 0; dst[10] = 1; dst[11] = 0;
      dst[12] = 0; dst[13] = 0; dst[14] = 0; dst[15] = 1;
      return dst;
    },

    scaling ([sx, sy, sz], dst) {
      dst = dst || new Float32Array(16);
      dst[0] = sx; dst[1] = 0; dst[2] = 0; dst[3] = 0;
      dst[4] = 0; dst[5] = sy; dst[6] = 0; dst[7] = 0;
      dst[8] = 0; dst[9] = 0; dst[10] = sz; dst[11] = 0;
      dst[12] = 0; dst[13] = 0; dst[14] = 0; dst[15] = 1;
      return dst;
    },

    translate (m, translation, dst) {
      return VectorMath.mat4.multiply(m, VectorMath.mat4.translation(translation), dst);
    },

    rotateX (m, angleInRadians, dst) {
      return VectorMath.mat4.multiply(m, VectorMath.mat4.rotationX(angleInRadians), dst);
    },

    rotateY (m, angleInRadians, dst) {
      return VectorMath.mat4.multiply(m, VectorMath.mat4.rotationY(angleInRadians), dst);
    },

    rotateZ (m, angleInRadians, dst) {
      return VectorMath.mat4.multiply(m, VectorMath.mat4.rotationZ(angleInRadians), dst);
    },

    scale (m, scale, dst) {
      return VectorMath.mat4.multiply(m, VectorMath.mat4.scaling(scale), dst);
    },
  },
  mat3: {
    fromMat4 (m, dst) {
      dst = dst || new Float32Array(12);

      dst[0] = m[0]; dst[1] = m[1]; dst[2] = m[2];
      dst[4] = m[4]; dst[5] = m[5]; dst[6] = m[6];
      dst[8] = m[8]; dst[9] = m[9]; dst[10] = m[10];

      return dst;
    },
  },
  vec3: {
    cross (a, b, dst) {
      dst = dst || new Float32Array(3);

      const t0 = a[1] * b[2] - a[2] * b[1];
      const t1 = a[2] * b[0] - a[0] * b[2];
      const t2 = a[0] * b[1] - a[1] * b[0];

      dst[0] = t0;
      dst[1] = t1;
      dst[2] = t2;

      return dst;
    },

    subtract (a, b, dst) {
      dst = dst || new Float32Array(3);

      dst[0] = a[0] - b[0];
      dst[1] = a[1] - b[1];
      dst[2] = a[2] - b[2];

      return dst;
    },

    normalize (v, dst) {
      dst = dst || new Float32Array(3);

      const length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
      // make sure we don't divide by 0.
      if (length > 0.00001) {
        dst[0] = v[0] / length;
        dst[1] = v[1] / length;
        dst[2] = v[2] / length;
      } else {
        dst[0] = 0;
        dst[1] = 0;
        dst[2] = 0;
      }

      return dst;
    },
  }
}

function assert (element: any) {
  if (!element) {
    throw new Error('Required element not found');
  }
}

function createCubeVertices () {
  const positions = [
    // Front (+Z)
    -1, -1, 1,
    1, -1, 1,
    1, 1, 1,
    -1, 1, 1,

    // Back (-Z)
    1, -1, -1,
    -1, -1, -1,
    -1, 1, -1,
    1, 1, -1,

    // Left (-X)
    -1, -1, -1,
    -1, -1, 1,
    -1, 1, 1,
    -1, 1, -1,

    // Right (+X)
    1, -1, 1,
    1, -1, -1,
    1, 1, -1,
    1, 1, 1,

    // Top (+Y)
    -1, 1, 1,
    1, 1, 1,
    1, 1, -1,
    -1, 1, -1,

    // Bottom (-Y)
    -1, -1, -1,
    1, -1, -1,
    1, -1, 1,
    -1, -1, 1
  ]

  const indices = [
    0, 1, 2, 0, 2, 3,   // Front
    4, 5, 6, 4, 6, 7,   // Back
    8, 9, 10, 8, 10, 11,   // Left
    12, 13, 14, 12, 14, 15,   // Right
    16, 17, 18, 16, 18, 19,   // Top
    20, 21, 22, 20, 22, 23    // Bottom
  ]
  const normals = [
    0, 0, 1, // Front (+Z)
    0, 0, -1, // Back (-Z)
    -1, 0, 0, // Left (-X)
    1, 0, 0, // Right (+X)
    0, 1, 0, // Top (+Y)
    0, -1, 0, // Bottom (-Y)
  ]

  const numVertices = indices.length;

  const vertexData = new Float32Array(numVertices * 6);

  for (let i = 0; i < indices.length; ++i) {
    const positionNdx = indices[i] * 3;
    const position = positions.slice(positionNdx, positionNdx + 3);
    vertexData.set(position, i * 6);

    const quadNdx = (i / 6 | 0) * 3;
    const normal = normals.slice(quadNdx, quadNdx + 3);
    vertexData.set(normal, i * 6 + 3);
  }

  return {
    vertexData, numVertices
  }
}

main();