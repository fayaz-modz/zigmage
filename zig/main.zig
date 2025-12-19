const std = @import("std");

// WebGL2 externs
extern fn glClearColor(r: f32, g: f32, b: f32, a: f32) void;
extern fn glClear(mask: c_uint) void;
extern fn glCreateShader(type: c_uint) c_uint;
extern fn glShaderSource(shader: c_uint, count: c_int, string: [*]const [*]const u8, length: ?[*]const c_int) void;
extern fn glCompileShader(shader: c_uint) void;
extern fn glAttachShader(program: c_uint, shader: c_uint) void;
extern fn glCreateProgram() c_uint;
extern fn glLinkProgram(program: c_uint) void;
extern fn glUseProgram(program: c_uint) void;
extern fn glGetShaderParameter(shader: c_uint, pname: c_uint, params: *c_int) void;
extern fn glGetProgramParameter(program: c_uint, pname: c_uint, params: *c_int) void;
extern fn consoleLog(ptr: [*]const u8, len: usize) void;

// Texture externs
extern fn glGenTextures(n: c_int, textures: *c_uint) void;
extern fn glBindTexture(target: c_uint, texture: c_uint) void;
extern fn glTexImage2D(target: c_uint, level: c_int, internalformat: c_int, width: c_int, height: c_int, border: c_int, format: c_uint, type: c_uint, pixels: ?[*]const u8) void;
extern fn glTexParameteri(target: c_uint, pname: c_uint, param: c_int) void;
extern fn glActiveTexture(texture: c_uint) void;
extern fn glUniform1i(location: c_int, v0: c_int) void;
extern fn glGetUniformLocation(program: c_uint, name: [*]const u8) c_int;

// Constants
const GL_VERTEX_SHADER = 0x8B31;
const GL_FRAGMENT_SHADER = 0x8B30;
const GL_COLOR_BUFFER_BIT = 0x00004000;
const GL_TEXTURE_2D = 0x0DE1;
const GL_RGBA = 0x1908;
const GL_UNSIGNED_BYTE = 0x1401;
const GL_TEXTURE_WRAP_S = 0x2802;
const GL_TEXTURE_WRAP_T = 0x2803;
const GL_TEXTURE_MIN_FILTER = 0x2801;
const GL_TEXTURE_MAG_FILTER = 0x2800;
const GL_CLAMP_TO_EDGE = 0x812F;
const GL_LINEAR = 0x2601;
const GL_NEAREST = 0x2600;
const GL_LINEAR_MIPMAP_LINEAR = 0x2703;
const GL_TEXTURE0 = 0x84C0;
const GL_TEXTURE1 = 0x84C1;

extern fn glGenerateMipmap(target: c_uint) void;

const vertex_shader_src = @embedFile("shaders/vert.glsl");
const fragment_shader_src = @embedFile("shaders/frag.glsl");

// Uniform functions
extern fn glUniform1f(location: c_int, v0: f32) void;
extern fn glUniform2f(location: c_int, v0: f32, v1: f32) void;
extern fn glUniform4f(location: c_int, v0: f32, v1: f32, v2: f32, v3: f32) void;

// Buffer functions
extern fn glGenBuffers(n: c_int, buffers: *c_uint) void;
extern fn glBindBuffer(target: c_uint, buffer: c_uint) void;
extern fn glBufferData(target: c_uint, size: c_long, data: [*]const u8, usage: c_uint) void;
extern fn glVertexAttribPointer(index: c_uint, size: c_int, type: c_uint, normalized: u8, stride: c_int, offset: c_long) void;
extern fn glEnableVertexAttribArray(index: c_uint) void;
extern fn glDrawArrays(mode: c_uint, first: c_int, count: c_int) void;
extern fn glGenVertexArrays(n: c_int, arrays: *c_uint) void;
extern fn glBindVertexArray(array: c_uint) void;
extern fn glViewport(x: c_int, y: c_int, width: c_int, height: c_int) void;

const GL_ARRAY_BUFFER = 0x8892;
const GL_STATIC_DRAW = 0x88E4;
const GL_FLOAT = 0x1406;
const GL_TRIANGLE_STRIP = 0x0005;
const GL_FALSE = 0;

// -------------------------------------------------------------------------
// Types
// -------------------------------------------------------------------------

const Adjustments = struct {
    exposure: f32 = 0.0,
    contrast: f32 = 0.0,
    highlights: f32 = 0.0,
    shadows: f32 = 0.0,
    blacks: f32 = 0.0,
    temperature: f32 = 0.0,
    tint: f32 = 0.0,
    vibrance: f32 = 0.0,
    saturation: f32 = 0.0,
};

const Transform = struct {
    scale_x: f32 = 1.0,
    scale_y: f32 = 1.0,
    pan_x: f32 = 0.0,
    pan_y: f32 = 0.0,
};

const Crop = struct {
    x: f32 = 0.0,
    y: f32 = 0.0,
    w: f32 = 1.0,
    h: f32 = 1.0,
};

const Layer = struct {
    texture_id: c_uint,
    width: c_int,
    height: c_int,
    visible: bool = true,
};

const State = struct {
    layers: std.ArrayListUnmanaged(Layer),
    adjustments: Adjustments,
    transform: Transform,
    crop: Crop,

    // GL State
    program_id: c_uint = 0,
    vao: c_uint = 0,
    vbo: c_uint = 0,

    // Curves State
    curves_texture_id: c_uint = 0,
    u_curves_loc: c_int = -1,

    // Uniform Locations
    u_image_loc: c_int = -1,
    u_exposure_loc: c_int = -1,
    u_contrast_loc: c_int = -1,
    u_highlights_loc: c_int = -1,
    u_shadows_loc: c_int = -1,
    u_blacks_loc: c_int = -1,
    u_temperature_loc: c_int = -1,
    u_tint_loc: c_int = -1,
    u_vibrance_loc: c_int = -1,
    u_saturation_loc: c_int = -1,
    u_crop_loc: c_int = -1,
    u_scale_loc: c_int = -1,
    u_pan_loc: c_int = -1,

    viewport_width: f32 = 0,
    viewport_height: f32 = 0,
};

// -------------------------------------------------------------------------
// Global State
// -------------------------------------------------------------------------

var gpa = std.heap.GeneralPurposeAllocator(.{}){};
const allocator = gpa.allocator();
var state: State = undefined;

// Quad data (x, y, u, v)
const quad_data = [_]f32{
    -1.0, -1.0, 0.0, 1.0,
    1.0,  -1.0, 1.0, 1.0,
    -1.0, 1.0,  0.0, 0.0,
    1.0,  1.0,  1.0, 0.0,
};

// -------------------------------------------------------------------------
// API
// -------------------------------------------------------------------------

export fn init() void {
    const msg = "Zig Wasm Initializing...";
    consoleLog(msg.ptr, msg.len);

    state = State{
        .layers = .{},
        .adjustments = .{},
        .transform = .{},
        .crop = .{},
    };

    // Compile shaders
    const vs = glCreateShader(GL_VERTEX_SHADER);
    const vs_src_ptr: [*]const u8 = vertex_shader_src;
    const vs_src_ptr_ptr: [*]const [*]const u8 = @ptrCast(&vs_src_ptr);
    glShaderSource(vs, 1, vs_src_ptr_ptr, null);
    glCompileShader(vs);

    const fs = glCreateShader(GL_FRAGMENT_SHADER);
    const fs_src_ptr: [*]const u8 = fragment_shader_src;
    const fs_src_ptr_ptr: [*]const [*]const u8 = @ptrCast(&fs_src_ptr);
    glShaderSource(fs, 1, fs_src_ptr_ptr, null);
    glCompileShader(fs);

    state.program_id = glCreateProgram();
    glAttachShader(state.program_id, vs);
    glAttachShader(state.program_id, fs);
    glLinkProgram(state.program_id);
    glUseProgram(state.program_id);

    // Get uniform locations
    state.u_image_loc = glGetUniformLocation(state.program_id, "u_image");
    state.u_exposure_loc = glGetUniformLocation(state.program_id, "u_exposure");
    state.u_contrast_loc = glGetUniformLocation(state.program_id, "u_contrast");
    state.u_highlights_loc = glGetUniformLocation(state.program_id, "u_highlights");
    state.u_shadows_loc = glGetUniformLocation(state.program_id, "u_shadows");
    state.u_blacks_loc = glGetUniformLocation(state.program_id, "u_blacks");
    state.u_temperature_loc = glGetUniformLocation(state.program_id, "u_temperature");
    state.u_tint_loc = glGetUniformLocation(state.program_id, "u_tint");
    state.u_vibrance_loc = glGetUniformLocation(state.program_id, "u_vibrance");
    state.u_saturation_loc = glGetUniformLocation(state.program_id, "u_saturation");

    state.u_crop_loc = glGetUniformLocation(state.program_id, "u_crop");
    state.u_scale_loc = glGetUniformLocation(state.program_id, "u_scale");
    state.u_pan_loc = glGetUniformLocation(state.program_id, "u_pan");

    state.u_curves_loc = glGetUniformLocation(state.program_id, "u_curves");

    // Initialize Curves Texture (Identity)
    glGenTextures(1, &state.curves_texture_id);
    glActiveTexture(GL_TEXTURE1);
    glBindTexture(GL_TEXTURE_2D, state.curves_texture_id);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);

    // Initialize with Identity
    var identity_lut: [256 * 4]u8 = undefined;
    var i: usize = 0;
    while (i < 256) : (i += 1) {
        identity_lut[i * 4 + 0] = @intCast(i);
        identity_lut[i * 4 + 1] = @intCast(i);
        identity_lut[i * 4 + 2] = @intCast(i);
        identity_lut[i * 4 + 3] = 255;
    }
    const identity_ptr: [*]const u8 = @ptrCast(&identity_lut);
    glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA, 256, 1, 0, GL_RGBA, GL_UNSIGNED_BYTE, identity_ptr);

    // Defaults
    updateUniforms();

    // Setup Quad
    glGenVertexArrays(1, &state.vao);
    glBindVertexArray(state.vao);

    glGenBuffers(1, &state.vbo);
    glBindBuffer(GL_ARRAY_BUFFER, state.vbo);

    const data_ptr: [*]const u8 = @ptrCast(&quad_data);
    glBufferData(GL_ARRAY_BUFFER, @sizeOf(@TypeOf(quad_data)), data_ptr, GL_STATIC_DRAW);

    // Position
    glVertexAttribPointer(0, 2, GL_FLOAT, GL_FALSE, 4 * 4, 0);
    glEnableVertexAttribArray(0);

    // TexCoord
    glVertexAttribPointer(1, 2, GL_FLOAT, GL_FALSE, 4 * 4, 2 * 4);
    glEnableVertexAttribArray(1);

    const ready_msg = "Zig Wasm Ready";
    consoleLog(ready_msg.ptr, ready_msg.len);
}

fn updateUniforms() void {
    glUseProgram(state.program_id);

    // Adjustments
    glUniform1f(state.u_exposure_loc, state.adjustments.exposure);
    glUniform1f(state.u_contrast_loc, state.adjustments.contrast);
    glUniform1f(state.u_highlights_loc, state.adjustments.highlights);
    glUniform1f(state.u_shadows_loc, state.adjustments.shadows);
    glUniform1f(state.u_blacks_loc, state.adjustments.blacks);
    glUniform1f(state.u_temperature_loc, state.adjustments.temperature);
    glUniform1f(state.u_tint_loc, state.adjustments.tint);
    glUniform1f(state.u_vibrance_loc, state.adjustments.vibrance);
    glUniform1f(state.u_saturation_loc, state.adjustments.saturation);

    // Transform & Crop
    glUniform4f(state.u_crop_loc, state.crop.x, state.crop.y, state.crop.w, state.crop.h);
    glUniform2f(state.u_scale_loc, state.transform.scale_x, state.transform.scale_y);
    glUniform2f(state.u_pan_loc, state.transform.pan_x, state.transform.pan_y);
}

export fn alloc(size: usize) usize {
    const slice = allocator.alloc(u8, size) catch return 0;
    return @intFromPtr(slice.ptr);
}

export fn free(ptr: usize, size: usize) void {
    const slice_ptr: [*]u8 = @ptrFromInt(ptr);
    allocator.free(slice_ptr[0..size]);
}

export fn addLayer(width: c_int, height: c_int, data_ptr_int: usize) void {
    const data_ptr: [*]const u8 = @ptrFromInt(data_ptr_int);

    var texture_id: c_uint = 0;
    glGenTextures(1, &texture_id);

    glActiveTexture(GL_TEXTURE0);
    glBindTexture(GL_TEXTURE_2D, texture_id);

    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR_MIPMAP_LINEAR);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_NEAREST);

    glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA, width, height, 0, GL_RGBA, GL_UNSIGNED_BYTE, data_ptr);
    glGenerateMipmap(GL_TEXTURE_2D);

    const layer = Layer{
        .texture_id = texture_id,
        .width = width,
        .height = height,
    };

    state.layers.append(allocator, layer) catch {
        const msg = "Failed to append layer";
        consoleLog(msg.ptr, msg.len);
        return;
    };

    const msg = "Layer added";
    consoleLog(msg.ptr, msg.len);
}

extern fn glDeleteTextures(n: c_int, textures: *c_uint) void;

export fn resetLayers() void {
    // Clear layers
    for (state.layers.items) |layer| {
        var textures = [1]c_uint{layer.texture_id};
        glDeleteTextures(1, &textures[0]);
    }
    state.layers.clearRetainingCapacity();

    // Reset Image Size derived state if any?
    // We rely on layer properties.

    const msg = "Layers reset";
    consoleLog(msg.ptr, msg.len);
}

// -------------------------------------------------------------------------
// Setters - Individual
// -------------------------------------------------------------------------

export fn setExposure(val: f32) void {
    state.adjustments.exposure = val;
}
export fn setContrast(val: f32) void {
    state.adjustments.contrast = val;
}
export fn setHighlights(val: f32) void {
    state.adjustments.highlights = val;
}
export fn setShadows(val: f32) void {
    state.adjustments.shadows = val;
}
export fn setBlacks(val: f32) void {
    state.adjustments.blacks = val;
}
export fn setTemperature(val: f32) void {
    state.adjustments.temperature = val;
}
export fn setTint(val: f32) void {
    state.adjustments.tint = val;
}
export fn setVibrance(val: f32) void {
    state.adjustments.vibrance = val;
}
export fn setSaturation(val: f32) void {
    state.adjustments.saturation = val;
}

export fn setTransform(scale_x: f32, scale_y: f32, pan_x: f32, pan_y: f32) void {
    state.transform.scale_x = scale_x;
    state.transform.scale_y = scale_y;
    state.transform.pan_x = pan_x;
    state.transform.pan_y = pan_y;
}

export fn setCrop(x: f32, y: f32, w: f32, h: f32) void {
    state.crop.x = x;
    state.crop.y = y;
    state.crop.w = w;
    state.crop.h = h;
}

export fn updateViewport(width: f32, height: f32) void {
    state.viewport_width = width;
    state.viewport_height = height;
    glViewport(0, 0, @intFromFloat(width), @intFromFloat(height));
}

export fn setCurves(data_ptr_int: usize) void {
    const data_ptr: [*]const u8 = @ptrFromInt(data_ptr_int);

    glActiveTexture(GL_TEXTURE1);
    glBindTexture(GL_TEXTURE_2D, state.curves_texture_id);

    // We assume 256x1 texture
    glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA, 256, 1, 0, GL_RGBA, GL_UNSIGNED_BYTE, data_ptr);
}

// -------------------------------------------------------------------------
// Render
// -------------------------------------------------------------------------

export fn render(time: f32) void {
    _ = time;
    glClearColor(0.0, 0.0, 0.0, 1.0);
    glClear(GL_COLOR_BUFFER_BIT);

    glUseProgram(state.program_id);

    // Update Adjustments Uniforms
    glUniform1f(state.u_exposure_loc, state.adjustments.exposure);
    glUniform1f(state.u_contrast_loc, state.adjustments.contrast);
    glUniform1f(state.u_highlights_loc, state.adjustments.highlights);
    glUniform1f(state.u_shadows_loc, state.adjustments.shadows);
    glUniform1f(state.u_blacks_loc, state.adjustments.blacks);
    glUniform1f(state.u_temperature_loc, state.adjustments.temperature);
    glUniform1f(state.u_tint_loc, state.adjustments.tint);
    glUniform1f(state.u_vibrance_loc, state.adjustments.vibrance);
    glUniform1f(state.u_saturation_loc, state.adjustments.saturation);

    glUniform4f(state.u_crop_loc, state.crop.x, state.crop.y, state.crop.w, state.crop.h);

    // Bind Curves Texture
    glActiveTexture(GL_TEXTURE1);
    glBindTexture(GL_TEXTURE_2D, state.curves_texture_id);
    glUniform1i(state.u_curves_loc, 1); // Texture Unit 1

    glBindVertexArray(state.vao);

    // Viewport Aspect Ratio
    var viewport_aspect: f32 = 1.0;
    if (state.viewport_height > 0.0) {
        viewport_aspect = state.viewport_width / state.viewport_height;
    }

    for (state.layers.items) |layer| {
        if (!layer.visible) continue;

        // Calculate Aspect Ratio Correction
        var image_aspect: f32 = 1.0;
        if (layer.height > 0) {
            image_aspect = @as(f32, @floatFromInt(layer.width)) / @as(f32, @floatFromInt(layer.height));
        }

        var scale_x: f32 = 1.0;
        var scale_y: f32 = 1.0;

        if (image_aspect > viewport_aspect) {
            // Image is wider than viewport (relative to aspect), fit width
            // scale_x stays 1.0, scale_y shrinks
            scale_y = viewport_aspect / image_aspect;
        } else {
            // Image is taller or equal, fit height
            // scale_x shrinks
            scale_x = image_aspect / viewport_aspect;
        }

        // Apply user transform
        const final_scale_x = scale_x * state.transform.scale_x;
        const final_scale_y = scale_y * state.transform.scale_y;

        glUniform2f(state.u_scale_loc, final_scale_x, final_scale_y);
        glUniform2f(state.u_pan_loc, state.transform.pan_x, state.transform.pan_y);

        glActiveTexture(GL_TEXTURE0);
        glBindTexture(GL_TEXTURE_2D, layer.texture_id);
        glUniform1i(state.u_image_loc, 0); // Texture Unit 0
        glDrawArrays(GL_TRIANGLE_STRIP, 0, 4);
    }
}
