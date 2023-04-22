import type { RollupOptions, OutputOptions } from 'rollup';
export type JSConfig = {
    isproduction: boolean;
    tsconfig: string;
    input: string;
    src: string;
    dest: string;
    output: string;
    externals: string[];
    globals: {
        [key: string]: string;
    };
};
export declare const Input: (opts: JSConfig) => [RollupOptions, OutputOptions];
//# sourceMappingURL=rolluphelpers.d.ts.map