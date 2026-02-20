// @ts-nocheck

// Shader fragment is the main portion that causes the fractal
// Try changing the math functions and values!

const shaderCode = `
  struct Uniform {
    timestamp: f32  // for changing colors when time is elapsed
  };

  @group(0) @binding(0) var<uniform> uni: Uniform;

  struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) color: vec4f,
    @location(1) uv: vec2f, //actual vertex in clipSpace
  };

  @vertex
  fn v_main(@builtin(vertex_index) vertex_index : u32) -> VertexOutput {
    // two triangles to make a square, covering all clipspace
    let pos = array(
      vec2f(-1,  1),
      vec2f( 1,  1),
      vec2f(-1, -1),
      vec2f( 1,  1),
      vec2f( 1, -1),
      vec2f(-1, -1)
    );
    let colors = array(
      vec4f(1.0, 0.0, 0.0, 1.0),
      vec4f(0.0, 1.0, 0.0, 1.0),
      vec4f(0.0, 0.0, 1.0, 1.0),
      vec4f(0.0, 1.0, 0.0, 1.0),
      vec4f(1.0, 1.0, 0.0, 1.0),
      vec4f(0.0, 0.0, 1.0, 1.0)
    );

    var out: VertexOutput;
    out.position = vec4f(pos[vertex_index], 0.0, 1.0);
    out.color = colors[vertex_index];
    out.uv = pos[vertex_index];
    return out;
  }

  fn rand(co: vec2f) -> f32 {
        return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
  }

  @fragment
  fn f_main(input: VertexOutput) -> @location(0) vec4f {
    let time = uni.timestamp * 0.001;
    var uv = input.uv;
    let uvOriginalCoord = uv;
    var finalColor = vec3f(0.0);

    for (var i: f32 = 0.0; i < 4.0; i += 1.0) {
      // subdivide clipspace and center
      uv = fract(uv * 1.5) - 0.5;

      // calculate pixel distance from original uv, combined with math functions
      // the distance turns into wave pattenrs

      var distance = length(uv) * exp(-length(uvOriginalCoord));
      distance = sin(distance * 8.0 + time) / 8.0;
      distance = abs(distance);
      distance = pow(0.01 / distance, 1.2);

      let color = 0.5 + 0.5 * cos(vec3f(0.0, 2.0, 4.0) + time + i * 0.4);

      finalColor = finalColor + color * distance;
    }

    return vec4f(finalColor, 1.0);
  }
`;

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
    code: shaderCode,
  });

  const pipelineDescriptor = {
    vertex: {
      module: shaderModule,
      entryPoint: 'v_main'
    },
    fragment: {
      module: shaderModule,
      entryPoint: 'f_main',
      targets: [{ format }],
    },
    layout: 'auto'
  };

  const pipeline = device.createRenderPipeline(pipelineDescriptor);

  const uniformBufferSize = 4;
  const uniformBuffer = device.createBuffer({
    label: 'timestamp uniform buffer',
    size: uniformBufferSize,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const uniformValues = new Float32Array(uniformBufferSize / 4);

  const uniformBindGroup = device.createBindGroup({
    label: 'uniform bind group',
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

  function render (timestamp) {
    const encoder = device.createCommandEncoder();
    const texture = context.getCurrentTexture();

    const renderPassDescriptor = {
      label: 'canvas render pass',
      colorAttachments: [
        {
          clearValue: [0.3, 0.3, 0.3, 1],
          loadOp: 'clear',
          storeOp: 'store',
          view: texture.createView(),
        },
      ],
    };

    const renderPass = encoder.beginRenderPass(renderPassDescriptor);
    renderPass.setPipeline(pipeline);

    uniformValues[0] = timestamp;
    device.queue.writeBuffer(uniformBuffer, 0, uniformValues);
    renderPass.setBindGroup(0, uniformBindGroup);

    renderPass.draw(6);

    renderPass.end();
    device.queue.submit([encoder.finish()]);

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

function assert (element: unknown) {
  if (!element) {
    throw new Error('Required element not found');
  }
}

main();
