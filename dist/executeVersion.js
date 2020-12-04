"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = void 0;
const graphql_1 = require("graphql");
const scalarToValue = {
    String: "'Hello World'",
    Int: 123456,
    Float: 123.456,
    Boolean: true,
    ID: "'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'",
};
const plugin = (schema, documents, config) => {
    var _a, _b, _c;
    let unnamedOperationCount = 0;
    const results = [];
    for (const document of documents) {
        for (const definition of document.document.definitions) {
            if (definition.kind === graphql_1.Kind.OPERATION_DEFINITION) {
                const operationName = (_b = (_a = definition === null || definition === void 0 ? void 0 : definition.name) === null || _a === void 0 ? void 0 : _a.value) !== null && _b !== void 0 ? _b : `Unnamed_${++unnamedOperationCount}_`;
                const data = execute(schema, document.document, (_c = definition.name) === null || _c === void 0 ? void 0 : _c.value, config);
                results.push(`const ${operationName}Mock = { data: ${data} };`);
            }
        }
    }
    return results.join("\n\n");
};
exports.plugin = plugin;
// This is a very trimmed down version of this function, only taking what we need:
// https://github.com/graphql/graphql-js/blob/d6e760cf7060217bd25fa934bd104ff2400aad96/src/execution/execute.js#L300
function buildExecutionContext(schema, document, operationName, config // TODO: type
) {
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
    };
}
function execute(schema, document, operationName, config // TODO: type this
) {
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
    var _a, _b, _c, _d, _e, _f, _g;
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
    const type = graphql_1.getNamedType(fieldDef.type);
    if (fieldName === "__typename") {
        return `__typename: ${type.name}`;
    }
    if (type instanceof graphql_1.GraphQLScalarType) {
        const customScalarValue = (_d = (_c = context.config) === null || _c === void 0 ? void 0 : _c.scalarValues) === null || _d === void 0 ? void 0 : _d[type.name];
        if (customScalarValue) {
            if (typeof customScalarValue === "string") {
                return `${fieldReturnName}: '${customScalarValue}'`;
            }
            return `${fieldReturnName}: ${customScalarValue}`;
        }
        else if (scalarToValue[type.name]) {
            return `${fieldReturnName}: ${scalarToValue[type.name]}`;
        }
        return `${fieldReturnName}: 'custom'`;
    }
    if (type instanceof graphql_1.GraphQLObjectType) {
        return `${(_f = (_e = fieldNode.alias) === null || _e === void 0 ? void 0 : _e.value) !== null && _f !== void 0 ? _f : fieldNode.name.value}: ${executeSelectionSet(context, type, fieldNode.selectionSet)}`;
    }
    if (type instanceof graphql_1.GraphQLInterfaceType) {
        const types = getImplementingObjects(context.schema, type);
        return `${fieldReturnName}: ${executeSelectionSet(context, types[0], fieldNode.selectionSet)}`;
    }
    if (type instanceof graphql_1.GraphQLUnionType) {
        const selectedType = type.getTypes()[0];
        return `${fieldReturnName}: ${executeSelectionSet(context, selectedType, fieldNode.selectionSet)}`;
    }
    if (type instanceof graphql_1.GraphQLEnumType) {
        const value = (_g = type.getValues()[0]) === null || _g === void 0 ? void 0 : _g.name;
        return `${fieldReturnName}: '${value}'`;
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
//# sourceMappingURL=executeVersion.js.map