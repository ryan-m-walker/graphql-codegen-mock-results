export const myQueryMock = {
  data: {
    pokedex: {
      id: "e509e6ea-9fee-442a-9962-587ce7190430",
      created: "Hello World",
      name: "Hello World",
    },
  },
};

export const getPokemonMock = {
  data: {
    pokemon: {
      id: "e509e6ea-9fee-442a-9962-587ce7190430",
      abilities: {
        edges: [{ node: { name: "Hello World", description: "Hello World" } }],
      },
    },
  },
};
