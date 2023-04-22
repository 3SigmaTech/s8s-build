/// <reference types="node" />
/// <reference types="undertaker" />
/// <reference types="node" />
import * as rollup from 'rollup';
export declare function vendorjs(): Promise<void> | Promise<rollup.RollupOutput> | Promise<[rollup.RollupOutput, rollup.RollupOutput]>;
export declare function _vendorjsbase(iswatching?: boolean): Promise<void> | Promise<rollup.RollupOutput> | Promise<[rollup.RollupOutput, rollup.RollupOutput]>;
export declare function js(): Promise<rollup.RollupOutput> | Promise<[rollup.RollupOutput, rollup.RollupOutput]>;
export declare function visualizejs(): Promise<[rollup.RollupOutput, rollup.RollupOutput]>;
export declare function css(): Promise<void> | Promise<[NodeJS.ReadWriteStream]>;
export declare function statics(): Promise<[NodeJS.ReadWriteStream, NodeJS.ReadWriteStream, NodeJS.ReadWriteStream]>;
export declare function serverbuild(): NodeJS.ReadWriteStream | Promise<void>;
export declare function clean(): Promise<void>;
export declare const frontbuild: import("undertaker").TaskFunction;
export declare const build: import("undertaker").TaskFunction;
export declare const dev: import("undertaker").TaskFunction;
export declare const release: import("undertaker").TaskFunction;
export declare const incrementVersion: () => NodeJS.ReadWriteStream | Promise<NodeJS.Timeout>;
export declare const makeprivateflows: import("undertaker").TaskFunction;
export declare const makepublicflows: import("undertaker").TaskFunction;
//# sourceMappingURL=index.d.ts.map