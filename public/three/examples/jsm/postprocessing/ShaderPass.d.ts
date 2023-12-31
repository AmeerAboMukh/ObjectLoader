import { ShaderMaterial } from '../../../src/Three.js';

import { Pass, FullScreenQuad } from './Pass.js';

export class ShaderPass extends Pass {
    constructor(shader: object, textureID?: string);
    textureID: string;
    uniforms: { [name: string]: { value: any } };
    material: ShaderMaterial;
    fsQuad: FullScreenQuad;
}
