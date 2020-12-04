"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = void 0;
const tslib_1 = require("tslib");
const visitor_plugin_common_1 = require("@graphql-codegen/visitor-plugin-common");
const graphql_1 = require("graphql");
const seed_random_1 = tslib_1.__importDefault(require("seed-random"));
const defaultConfig = {
    noExport: false,
    nameSuffix: "Mock",
};
const plugin = (schema, documents, config, info) => {
    var _a, _b;
    const mergedConfig = {
        ...defaultConfig,
        ...config,
    };
    const isTS = !!((_a = info === null || info === void 0 ? void 0 : info.outputFile) === null || _a === void 0 ? void 0 : _a.match(/.ts$/));
    const buildName = nameBuilderFactory(mergedConfig);
    const results = [];
    for (const document of documents) {
        for (const definition of document.document.definitions) {
            if (definition.kind === graphql_1.Kind.OPERATION_DEFINITION) {
                const operationName = buildName(definition);
                const operationType = isTS
                    ? buildType(definition, schema, mergedConfig)
                    : "";
                const data = execute(schema, document.document, (_b = definition.name) === null || _b === void 0 ? void 0 : _b.value, mergedConfig);
                const exportValue = mergedConfig.noExport ? "" : "export";
                results.push(`${exportValue} const ${operationName}${operationType} = { data: ${data} };`);
            }
        }
    }
    const imports = [];
    if (isTS) {
        imports.push("import { ExecutionResult } from 'graphql'");
    }
    return {
        prepend: imports,
        content: results.join("\n\n"),
    };
};
exports.plugin = plugin;
// This is a very trimmed down version of this function, only taking what we need:
// https://github.com/graphql/graphql-js/blob/d6e760cf7060217bd25fa934bd104ff2400aad96/src/execution/execute.js#L300
function buildExecutionContext(schema, document, operationName, config) {
    var _a;
    let operation;
    const fragments = Object.create(null);
    for (const definition of document.definitions) {
        switch (definition.kind) {
            case graphql_1.Kind.OPERATION_DEFINITION:
                if (operationName == null) {
                    operation = definition;
                }
                else if (((_a = definition.name) === null || _a === void 0 ? void 0 : _a.value) === operationName) {
                    operation = definition;
                }
                break;
            case graphql_1.Kind.FRAGMENT_DEFINITION:
                fragments[definition.name.value] = definition;
        }
    }
    return {
        schema,
        fragments,
        operation,
        config,
        random: seed_random_1.default("123"),
    };
}
function execute(schema, document, operationName, config) {
    const context = buildExecutionContext(schema, document, operationName, config);
    const result = executeOperation(context, context.operation);
    return result;
}
function executeOperation(context, operation) {
    const type = graphql_1.getOperationRootType(context.schema, context.operation);
    const res = executeSelectionSet(context, type, operation.selectionSet);
    return res;
}
function executeSelectionSet(context, parentType, selectionSet) {
    const fields = collectFields(context, parentType, selectionSet, Object.create(null), Object.create(null));
    const result = [];
    for (const fieldName of Object.keys(fields)) {
        const field = resolveField(context, parentType, fields[fieldName]);
        // Filter unresolved fields (like on union selection set)
        if (field) {
            result.push(field);
        }
    }
    return `{ ${result.join(", ")} }`;
}
function resolveField(context, parentType, fieldNodes) {
    var _a, _b;
    const fieldNode = fieldNodes[0];
    const fieldName = fieldNode.name.value;
    const fieldReturnName = (_b = (_a = fieldNode.alias) === null || _a === void 0 ? void 0 : _a.value) !== null && _b !== void 0 ? _b : fieldName;
    if (fieldName === "__typename") {
        return `__typename: '${parentType.name}'`;
    }
    const fieldDef = parentType.getFields()[fieldName];
    if (!fieldDef) {
        return "";
    }
    // unwrap NonNull types
    const unwrapped = graphql_1.getNullableType(fieldDef.type);
    // unwrap list types
    const type = graphql_1.getNamedType(fieldDef.type);
    if (unwrapped instanceof graphql_1.GraphQLList) {
        return `${fieldReturnName}: [${handleNamedType(context, type, fieldNode, fieldReturnName)}]`;
    }
    return `${fieldReturnName}: ${handleNamedType(context, type, fieldNode, fieldName)}`;
}
function handleNamedType(context, type, fieldNode, fieldName
// fieldReturnName: string
) {
    var _a, _b, _c;
    // taken from https://github.com/ardatan/graphql-tools/blob/master/packages/mock/src/mocking.ts#L57-L64
    function uuidv4() {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
            const r = (context.random() * 16) | 0;
            const v = c == "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }
    const scalarToValue = {
        String: () => "'Hello World'",
        Int: () => Math.round(context.random() * 200 - 100),
        Float: () => Number((context.random() * 200 - 100).toFixed(2)),
        Boolean: () => context.random() > 0.5,
        ID: () => `'${uuidv4()}'`,
    };
    if (fieldName === "__typename") {
        return `__typename: ${type.name}`;
    }
    if (type instanceof graphql_1.GraphQLScalarType) {
        const customScalarValue = (_b = (_a = context.config) === null || _a === void 0 ? void 0 : _a.customValues) === null || _b === void 0 ? void 0 : _b[type.name];
        if (customScalarValue) {
            if (typeof customScalarValue === "string") {
                return `'${customScalarValue}'`;
            }
            return `${customScalarValue}`;
        }
        else if (scalarToValue[type.name]) {
            return `${scalarToValue[type.name]()}`;
        }
        return `'${type.name}'`;
    }
    if (type instanceof graphql_1.GraphQLObjectType) {
        return executeSelectionSet(context, type, fieldNode.selectionSet);
    }
    if (type instanceof graphql_1.GraphQLInterfaceType) {
        const types = getImplementingObjects(context.schema, type);
        return `${executeSelectionSet(context, types[0], fieldNode.selectionSet)}`;
    }
    if (type instanceof graphql_1.GraphQLUnionType) {
        const selectedType = type.getTypes()[0];
        return `${executeSelectionSet(context, selectedType, fieldNode.selectionSet)}`;
    }
    if (type instanceof graphql_1.GraphQLEnumType) {
        const value = (_c = type.getValues()[0]) === null || _c === void 0 ? void 0 : _c.name;
        return `'${value}'`;
    }
    // TODO: Input Object Type??
    return "";
}
function collectFields(context, runtimeType, selectionSet, fields, visitedFragmentNames) {
    var _a, _b;
    for (const selection of selectionSet.selections) {
        switch (selection.kind) {
            case graphql_1.Kind.FIELD: {
                const responseKey = (_b = (_a = selection.alias) === null || _a === void 0 ? void 0 : _a.value) !== null && _b !== void 0 ? _b : selection.name.value;
                if (!fields[responseKey]) {
                    fields[responseKey] = [];
                }
                fields[responseKey].push(selection);
                break;
            }
            case graphql_1.Kind.FRAGMENT_SPREAD: {
                const fragmentName = selection.name.value;
                if (visitedFragmentNames[fragmentName]) {
                    continue;
                }
                visitedFragmentNames[fragmentName] = true;
                const fragment = context.fragments[fragmentName];
                if (!fragment) {
                    continue;
                }
                collectFields(context, runtimeType, fragment.selectionSet, fields, visitedFragmentNames);
                break;
            }
            case graphql_1.Kind.INLINE_FRAGMENT: {
                collectFields(context, runtimeType, selection.selectionSet, fields, visitedFragmentNames);
            }
        }
    }
    return fields;
}
function getImplementingObjects(schema, gqlInterface) {
    return Object.values(schema.getTypeMap()).reduce((returnTypes, type) => {
        if (type instanceof graphql_1.GraphQLObjectType) {
            const interfaces = type.getInterfaces();
            if (interfaces.includes(gqlInterface)) {
                returnTypes.push(type);
            }
        }
        return returnTypes;
    }, []);
}
function toPascalCase(input) {
    return input[0].toLowerCase() + input.slice(1);
}
function capitalize(input) {
    return input[0].toUpperCase() + input.slice(1);
}
// TODO: clean up this function
function nameBuilderFactory(config) {
    let unnamedOperationCount = 0;
    return function buildName(operation) {
        var _a, _b;
        let name = "";
        if (config.namePrefix) {
            name += config.namePrefix;
        }
        const formatter = config.namePrefix ? capitalize : toPascalCase;
        const baseName = (_b = (_a = operation.name) === null || _a === void 0 ? void 0 : _a.value) !== null && _b !== void 0 ? _b : `Unnamed_${++unnamedOperationCount}_`;
        name += formatter(baseName);
        name += config.nameSuffix;
        return name;
    };
}
function buildType(operation, schema, config) {
    const root = graphql_1.getOperationRootType(schema, operation);
    const convert = visitor_plugin_common_1.convertFactory({ namingConvention: config.namePrefix });
    const name = convert(operation);
    console.log(name);
    return `: ExecutionResult<${name + root.name}>`;
    // const name = operation
}
//# sourceMappingURL=index.js.map