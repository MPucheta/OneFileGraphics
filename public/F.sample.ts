// @ts-nocheck

const CHANGE_FOV_AND_RUN = 110;

const mat4 = {
  perspective(fieldOfViewYInRadians, aspect, zNear, zFar, dst) {
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
  makeZToWMatrix(fudgeFactor) {
    return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, fudgeFactor, 0, 0, 0, 1];
  },
  ortho(left, right, bottom, top, near, far, dst) {
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
  projection(width, height, depth, dst) {
    // Note: This matrix flips the Y axis so that 0 is at the top.
    dst = dst || new Float32Array(16);
    dst[0] = 2 / width;
    dst[1] = 0;
    dst[2] = 0;
    dst[3] = 0;
    dst[4] = 0;
    dst[5] = -2 / height;
    dst[6] = 0;
    dst[7] = 0;
    dst[8] = 0;
    dst[9] = 0;
    dst[10] = 0.5 / depth;
    dst[11] = 0;
    dst[12] = -1;
    dst[13] = 1;
    dst[14] = 0.5;
    dst[15] = 1;
    return dst;
  },

  identity(dst) {
    dst = dst || new Float32Array(16);
    dst[0] = 1;
    dst[1] = 0;
    dst[2] = 0;
    dst[3] = 0;
    dst[4] = 0;
    dst[5] = 1;
    dst[6] = 0;
    dst[7] = 0;
    dst[8] = 0;
    dst[9] = 0;
    dst[10] = 1;
    dst[11] = 0;
    dst[12] = 0;
    dst[13] = 0;
    dst[14] = 0;
    dst[15] = 1;
    return dst;
  },

  multiply(a, b, dst) {
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

  translation([tx, ty, tz], dst) {
    dst = dst || new Float32Array(16);
    dst[0] = 1;
    dst[1] = 0;
    dst[2] = 0;
    dst[3] = 0;
    dst[4] = 0;
    dst[5] = 1;
    dst[6] = 0;
    dst[7] = 0;
    dst[8] = 0;
    dst[9] = 0;
    dst[10] = 1;
    dst[11] = 0;
    dst[12] = tx;
    dst[13] = ty;
    dst[14] = tz;
    dst[15] = 1;
    return dst;
  },

  rotationX(angleInRadians, dst) {
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    dst = dst || new Float32Array(16);
    dst[0] = 1;
    dst[1] = 0;
    dst[2] = 0;
    dst[3] = 0;
    dst[4] = 0;
    dst[5] = c;
    dst[6] = s;
    dst[7] = 0;
    dst[8] = 0;
    dst[9] = -s;
    dst[10] = c;
    dst[11] = 0;
    dst[12] = 0;
    dst[13] = 0;
    dst[14] = 0;
    dst[15] = 1;
    return dst;
  },

  rotationY(angleInRadians, dst) {
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    dst = dst || new Float32Array(16);
    dst[0] = c;
    dst[1] = 0;
    dst[2] = -s;
    dst[3] = 0;
    dst[4] = 0;
    dst[5] = 1;
    dst[6] = 0;
    dst[7] = 0;
    dst[8] = s;
    dst[9] = 0;
    dst[10] = c;
    dst[11] = 0;
    dst[12] = 0;
    dst[13] = 0;
    dst[14] = 0;
    dst[15] = 1;
    return dst;
  },

  rotationZ(angleInRadians, dst) {
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    dst = dst || new Float32Array(16);
    dst[0] = c;
    dst[1] = s;
    dst[2] = 0;
    dst[3] = 0;
    dst[4] = -s;
    dst[5] = c;
    dst[6] = 0;
    dst[7] = 0;
    dst[8] = 0;
    dst[9] = 0;
    dst[10] = 1;
    dst[11] = 0;
    dst[12] = 0;
    dst[13] = 0;
    dst[14] = 0;
    dst[15] = 1;
    return dst;
  },

  scaling([sx, sy, sz], dst) {
    dst = dst || new Float32Array(16);
    dst[0] = sx;
    dst[1] = 0;
    dst[2] = 0;
    dst[3] = 0;
    dst[4] = 0;
    dst[5] = sy;
    dst[6] = 0;
    dst[7] = 0;
    dst[8] = 0;
    dst[9] = 0;
    dst[10] = sz;
    dst[11] = 0;
    dst[12] = 0;
    dst[13] = 0;
    dst[14] = 0;
    dst[15] = 1;
    return dst;
  },

  translate(m, translation, dst) {
    return mat4.multiply(m, mat4.translation(translation), dst);
  },

  rotateX(m, angleInRadians, dst) {
    return mat4.multiply(m, mat4.rotationX(angleInRadians), dst);
  },

  rotateY(m, angleInRadians, dst) {
    return mat4.multiply(m, mat4.rotationY(angleInRadians), dst);
  },

  rotateZ(m, angleInRadians, dst) {
    return mat4.multiply(m, mat4.rotationZ(angleInRadians), dst);
  },

  scale(m, scale, dst) {
    return mat4.multiply(m, mat4.scaling(scale), dst);
  },
};

const rand = (min, max) => {
  if (min === undefined) {
    min = 0;
    max = 1;
  } else if (max === undefined) {
    max = min;
    min = 0;
  }
  return min + Math.random() * (max - min);
};

function assert(element: any) {
  if (!element) {
    throw new Error('Required element not found');
  }
}

function createFVertices() {
  const positions = new Float32Array([
    0, 0, 0, 30, 0, 0, 0, 150, 0, 30, 150, 0, 30, 0, 0, 100, 0, 0, 30, 30, 0,
    100, 30, 0, 30, 60, 0, 70, 60, 0, 30, 90, 0, 70, 90, 0, 0, 0, 30, 30, 0, 30,
    0, 150, 30, 30, 150, 30, 30, 0, 30, 100, 0, 30, 30, 30, 30, 100, 30, 30, 30,
    60, 30, 70, 60, 30, 30, 90, 30, 70, 90, 30,
  ]);

  const indices = [
    0, 1, 2, 2, 1, 3, 4, 5, 6, 6, 5, 7, 8, 9, 10, 10, 9, 11, 12, 14, 13, 14, 15,
    13, 16, 18, 17, 18, 19, 17, 20, 22, 21, 22, 23, 21, 0, 12, 5, 12, 17, 5, 5,
    17, 7, 17, 19, 7, 6, 7, 18, 18, 7, 19, 6, 18, 8, 18, 20, 8, 8, 20, 9, 20,
    21, 9, 9, 21, 11, 21, 23, 11, 10, 11, 22, 22, 11, 23, 10, 22, 3, 22, 15, 3,
    2, 3, 14, 14, 3, 15, 0, 2, 12, 12, 2, 14,
  ];

  const quadColors = [
    200, 70, 120, 200, 70, 120, 200, 70, 120,

    80, 70, 200, 80, 70, 200, 80, 70, 200,

    70, 200, 210, 160, 160, 220, 90, 130, 110, 200, 200, 70, 210, 100, 70, 210,
    160, 70, 70, 180, 210, 100, 70, 210, 76, 210, 100, 140, 210, 80,
  ];

  const numVertices = indices.length;

  const vertexData = new Float32Array(numVertices * 4); //vertices * color
  vertexData.fill(-1);

  const colorData = new Uint8Array(vertexData.buffer); //shared data

  for (let i = 0; i < indices.length; ++i) {
    const positionNdx = indices[i] * 3;
    const position = positions.slice(positionNdx, positionNdx + 3);

    vertexData.set(position, i * 4); // setting 3 values at once + 1 dummy = W

    const quadNdx = ((i / 6) | 0) * 3;
    const color = quadColors.slice(quadNdx, quadNdx + 3);
    // calculation is bit hard to explain
    // +12 => space for 3 colors => 3 bytes => each color = 8 bits
    // [ R G B R G B R G B A A A ]
    // 16 * 8bits/1byte = 16 bytes => 4positions x 4byte [X,Y,Z,W], W actually defaults to 1
    colorData.set(color, i * 16 + 12);
    colorData[i * 16 + 15] = 255; // alpha
  }
  return {
    vertexData,
    numVertices,
  };
}

async function main() {
  const canvas = document.getElementById('3dCanvas');

  const gpu = navigator.gpu;

  assert(gpu);

  const adapter = await gpu.requestAdapter();

  assert(adapter);

  const device = await adapter.requestDevice();

  assert(device);

  const context = canvas.getContext('webgpu');

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
             matrix: mat4x4f,
            }

            struct VSOutput {
                @builtin(position) position: vec4f,
                @location(0) color: vec4f,
            }

            struct Vertex {
                @location(0) position: vec4f,
                @location(1) color: vec4f,
           }

           @group(0) @binding(0) var<uniform> uni: Uniforms;

           @vertex
           fn v_main(
           vert: Vertex,
           ) -> VSOutput{
              var vsOut: VSOutput;

              vsOut.position = uni.matrix * vert.position;
              vsOut.color = vert.color;

              return vsOut;
           }

           @fragment
           fn f_main(vsOut: VSOutput) -> @location(0) vec4f {
                return vsOut.color;
           }
        `,
  });

  const pipelineDescriptor = {
    vertex: {
      module: shaderModule,
      entryPoint: 'v_main',
      buffers: [
        {
          arrayStride: 4 * 4, //3 floats of 4bytes + 1 byte color
          attributes: [
            { shaderLocation: 0, offset: 0, format: 'float32x3' },
            { shaderLocation: 1, offset: 12, format: 'unorm8x4' },
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
      cullMode: 'front',
    },
    depthStencil: {
      depthWriteEnabled: true,
      depthCompare: 'less',
      format: 'depth24plus',
    },
  };

  const pipeline = device.createRenderPipeline(pipelineDescriptor);

  //layout divided by 16bytes, 48bytes is aligned

  const numObjects = 1;
  const objectInfos = [];

  const { vertexData, numVertices } = createFVertices();

  const vertexBuffer = device.createBuffer({
    label: 'vertex buffer',
    size: vertexData.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });

  device.queue.writeBuffer(vertexBuffer, 0, vertexData);

  for (let i = 0; i < numObjects; i++) {
    const unifromBufferSize = 16 * 4;
    const uniformBuffer = device.createBuffer({
      label: 'uni',
      size: unifromBufferSize,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const uniformValues = new Float32Array(unifromBufferSize / 4);

    const kMatrixOffset = 0;

    const matrixValue = uniformValues.subarray(
      kMatrixOffset,
      kMatrixOffset + 16
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
      matrixValue,
    });
  }

  const degToRad = (d) => (d * Math.PI) / 180;

  const settings = {
    fieldOfView: degToRad(CHANGE_FOV_AND_RUN),
    translation: [35, 0, -120],
    rotation: [degToRad(220), degToRad(25), degToRad(325)],
    scale: [1, 1, 1],
  };

  function render(timestamp) {
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

    for (const objInfo of objectInfos) {
      const { uniformBuffer, uniformValues, matrixValue, bindGroup } = objInfo;
      const aspect = canvas.clientWidth / canvas.clientHeight;

      mat4.perspective(settings.fieldOfView, aspect, 1, 2000, matrixValue);

      const timestampAwareDegChange = (timestamp * 0.001) % 360;

      mat4.translate(matrixValue, settings.translation, matrixValue);
      mat4.rotateX(
        matrixValue,
        settings.rotation[0] + timestampAwareDegChange,
        matrixValue
      );
      mat4.rotateY(
        matrixValue,
        settings.rotation[1] + timestampAwareDegChange,
        matrixValue
      );
      mat4.rotateZ(matrixValue, settings.rotation[2] + 10, matrixValue);
      mat4.scale(matrixValue, settings.scale, matrixValue);

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

main();

console.log('test output');
