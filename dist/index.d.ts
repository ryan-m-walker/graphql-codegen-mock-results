import { PluginFunction, Types } from "@graphql-codegen/plugin-helpers";
declare type MocksPluginConfig = {
    customValues?: {
        [key: string]: any;
    };
    noExport?: boolean;
    namePrefix?: string;
    nameSuffix?: string;
    namingConvention?: string;
};
export declare const plugin: PluginFunction<MocksPluginConfig, Types.ComplexPluginOutput>;
export {};
