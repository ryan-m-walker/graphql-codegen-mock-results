import { ExecutionResult } from "graphql";
import gql from "graphql-tag";
export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
};

export type Ability = Node & {
  __typename?: "Ability";
  id: Scalars["ID"];
  name?: Maybe<Scalars["String"]>;
  created?: Maybe<Scalars["String"]>;
  modified?: Maybe<Scalars["String"]>;
  description?: Maybe<Scalars["String"]>;
  resource_uri?: Maybe<Scalars["String"]>;
};

export type AbilityConnection = {
  __typename?: "AbilityConnection";
  pageInfo: PageInfo;
  edges?: Maybe<Array<Maybe<AbilityEdge>>>;
};

export type AbilityEdge = {
  __typename?: "AbilityEdge";
  node?: Maybe<Ability>;
  cursor: Scalars["String"];
};

export type Description = Node & {
  __typename?: "Description";
  created?: Maybe<Scalars["String"]>;
  description?: Maybe<Scalars["String"]>;
  games?: Maybe<GameConnection>;
  id: Scalars["ID"];
  modified?: Maybe<Scalars["String"]>;
  name?: Maybe<Scalars["String"]>;
  pokemon?: Maybe<Pokemon>;
  resource_uri?: Maybe<Scalars["String"]>;
};

export type DescriptionGamesArgs = {
  after?: Maybe<Scalars["String"]>;
  first?: Maybe<Scalars["Int"]>;
  before?: Maybe<Scalars["String"]>;
  last?: Maybe<Scalars["Int"]>;
};

export type DescriptionConnection = {
  __typename?: "DescriptionConnection";
  pageInfo: PageInfo;
  edges?: Maybe<Array<Maybe<DescriptionEdge>>>;
};

export type DescriptionEdge = {
  __typename?: "DescriptionEdge";
  node?: Maybe<Description>;
  cursor: Scalars["String"];
};

export type Egg = Node & {
  __typename?: "Egg";
  created?: Maybe<Scalars["String"]>;
  id: Scalars["ID"];
  modified?: Maybe<Scalars["String"]>;
  name?: Maybe<Scalars["String"]>;
  pokemon?: Maybe<PokemonConnection>;
  resource_uri?: Maybe<Scalars["String"]>;
};

export type EggPokemonArgs = {
  after?: Maybe<Scalars["String"]>;
  first?: Maybe<Scalars["Int"]>;
  before?: Maybe<Scalars["String"]>;
  last?: Maybe<Scalars["Int"]>;
};

export type EggConnection = {
  __typename?: "EggConnection";
  pageInfo: PageInfo;
  edges?: Maybe<Array<Maybe<EggEdge>>>;
};

export type EggEdge = {
  __typename?: "EggEdge";
  node?: Maybe<Egg>;
  cursor: Scalars["String"];
};

export type Evolution = {
  __typename?: "Evolution";
  level?: Maybe<Scalars["Int"]>;
  method?: Maybe<Scalars["String"]>;
  pokemon?: Maybe<Pokemon>;
  to?: Maybe<Scalars["String"]>;
};

export type Game = Node & {
  __typename?: "Game";
  created?: Maybe<Scalars["String"]>;
  generation?: Maybe<Scalars["Int"]>;
  id: Scalars["ID"];
  modified?: Maybe<Scalars["String"]>;
  name?: Maybe<Scalars["String"]>;
  release_year?: Maybe<Scalars["Int"]>;
  resource_uri?: Maybe<Scalars["String"]>;
};

export type GameConnection = {
  __typename?: "GameConnection";
  pageInfo: PageInfo;
  edges?: Maybe<Array<Maybe<GameEdge>>>;
};

export type GameEdge = {
  __typename?: "GameEdge";
  node?: Maybe<Game>;
  cursor: Scalars["String"];
};

export type Move = Node & {
  __typename?: "Move";
  accuracy?: Maybe<Scalars["Int"]>;
  category?: Maybe<Scalars["String"]>;
  created?: Maybe<Scalars["String"]>;
  description?: Maybe<Scalars["String"]>;
  id: Scalars["ID"];
  modified?: Maybe<Scalars["String"]>;
  name?: Maybe<Scalars["String"]>;
  power?: Maybe<Scalars["Int"]>;
  pp?: Maybe<Scalars["Int"]>;
  resource_uri?: Maybe<Scalars["String"]>;
};

export type MoveConnection = {
  __typename?: "MoveConnection";
  pageInfo: PageInfo;
  edges?: Maybe<Array<Maybe<MoveEdge>>>;
};

export type MoveEdge = {
  __typename?: "MoveEdge";
  node?: Maybe<Move>;
  cursor: Scalars["String"];
};

export type Node = {
  id: Scalars["ID"];
};

export type PageInfo = {
  __typename?: "PageInfo";
  hasNextPage: Scalars["Boolean"];
  hasPreviousPage: Scalars["Boolean"];
  startCursor?: Maybe<Scalars["String"]>;
  endCursor?: Maybe<Scalars["String"]>;
};

export type Pokedex = Node & {
  __typename?: "Pokedex";
  id: Scalars["ID"];
  created?: Maybe<Scalars["String"]>;
  modified?: Maybe<Scalars["String"]>;
  name?: Maybe<Scalars["String"]>;
  pokemon?: Maybe<PokemonConnection>;
  resource_uri?: Maybe<Scalars["String"]>;
};

export type PokedexPokemonArgs = {
  start: Scalars["Int"];
  number: Scalars["Int"];
};

export type Pokemon = Node & {
  __typename?: "Pokemon";
  id: Scalars["ID"];
  abilities?: Maybe<AbilityConnection>;
  attack?: Maybe<Scalars["Int"]>;
  catch_rate?: Maybe<Scalars["Int"]>;
  created?: Maybe<Scalars["String"]>;
  defense?: Maybe<Scalars["Int"]>;
  descriptions?: Maybe<DescriptionConnection>;
  egg_cycles?: Maybe<Scalars["Int"]>;
  egg_groups?: Maybe<EggConnection>;
  ev_yield?: Maybe<Scalars["String"]>;
  evolutions?: Maybe<Array<Maybe<Evolution>>>;
  exp?: Maybe<Scalars["Int"]>;
  growth_rate?: Maybe<Scalars["String"]>;
  happiness?: Maybe<Scalars["Int"]>;
  height?: Maybe<Scalars["String"]>;
  hp?: Maybe<Scalars["Int"]>;
  male_female_ratio?: Maybe<Scalars["String"]>;
  modified?: Maybe<Scalars["String"]>;
  moves?: Maybe<MoveConnection>;
  name?: Maybe<Scalars["String"]>;
  national_id?: Maybe<Scalars["Int"]>;
  pkdx_id?: Maybe<Scalars["Int"]>;
  resource_uri?: Maybe<Scalars["String"]>;
  sp_atk?: Maybe<Scalars["Int"]>;
  sp_def?: Maybe<Scalars["Int"]>;
  species?: Maybe<Scalars["String"]>;
  speed?: Maybe<Scalars["Int"]>;
  sprites?: Maybe<SpriteConnection>;
  total?: Maybe<Scalars["Int"]>;
  types?: Maybe<TypeConnection>;
  weight?: Maybe<Scalars["String"]>;
};

export type PokemonAbilitiesArgs = {
  after?: Maybe<Scalars["String"]>;
  first?: Maybe<Scalars["Int"]>;
  before?: Maybe<Scalars["String"]>;
  last?: Maybe<Scalars["Int"]>;
};

export type PokemonDescriptionsArgs = {
  after?: Maybe<Scalars["String"]>;
  first?: Maybe<Scalars["Int"]>;
  before?: Maybe<Scalars["String"]>;
  last?: Maybe<Scalars["Int"]>;
};

export type PokemonEgg_GroupsArgs = {
  after?: Maybe<Scalars["String"]>;
  first?: Maybe<Scalars["Int"]>;
  before?: Maybe<Scalars["String"]>;
  last?: Maybe<Scalars["Int"]>;
};

export type PokemonMovesArgs = {
  after?: Maybe<Scalars["String"]>;
  first?: Maybe<Scalars["Int"]>;
  before?: Maybe<Scalars["String"]>;
  last?: Maybe<Scalars["Int"]>;
};

export type PokemonSpritesArgs = {
  after?: Maybe<Scalars["String"]>;
  first?: Maybe<Scalars["Int"]>;
  before?: Maybe<Scalars["String"]>;
  last?: Maybe<Scalars["Int"]>;
};

export type PokemonTypesArgs = {
  after?: Maybe<Scalars["String"]>;
  first?: Maybe<Scalars["Int"]>;
  before?: Maybe<Scalars["String"]>;
  last?: Maybe<Scalars["Int"]>;
};

export type PokemonConnection = {
  __typename?: "PokemonConnection";
  pageInfo: PageInfo;
  edges?: Maybe<Array<Maybe<PokemonEdge>>>;
};

export type PokemonEdge = {
  __typename?: "PokemonEdge";
  node?: Maybe<Pokemon>;
  cursor: Scalars["String"];
};

export type Query = {
  __typename?: "Query";
  node?: Maybe<Node>;
  pokedex?: Maybe<Pokedex>;
  pokemon?: Maybe<Pokemon>;
};

export type QueryNodeArgs = {
  id: Scalars["ID"];
};

export type QueryPokemonArgs = {
  number: Scalars["Int"];
};

export type Sprite = Node & {
  __typename?: "Sprite";
  created?: Maybe<Scalars["String"]>;
  id: Scalars["ID"];
  image?: Maybe<Scalars["String"]>;
  modified?: Maybe<Scalars["String"]>;
  name?: Maybe<Scalars["String"]>;
  pokemon?: Maybe<Pokemon>;
  resource_uri?: Maybe<Scalars["String"]>;
};

export type SpriteConnection = {
  __typename?: "SpriteConnection";
  pageInfo: PageInfo;
  edges?: Maybe<Array<Maybe<SpriteEdge>>>;
};

export type SpriteEdge = {
  __typename?: "SpriteEdge";
  node?: Maybe<Sprite>;
  cursor: Scalars["String"];
};

export type Type = Node & {
  __typename?: "Type";
  created?: Maybe<Scalars["String"]>;
  id: Scalars["ID"];
  ineffective?: Maybe<TypeConnection>;
  modified?: Maybe<Scalars["String"]>;
  name?: Maybe<Scalars["String"]>;
  no_effect?: Maybe<TypeConnection>;
  resistance?: Maybe<TypeConnection>;
  resource_uri?: Maybe<Scalars["String"]>;
  super_effective?: Maybe<TypeConnection>;
  weakness?: Maybe<TypeConnection>;
};

export type TypeIneffectiveArgs = {
  after?: Maybe<Scalars["String"]>;
  first?: Maybe<Scalars["Int"]>;
  before?: Maybe<Scalars["String"]>;
  last?: Maybe<Scalars["Int"]>;
};

export type TypeNo_EffectArgs = {
  after?: Maybe<Scalars["String"]>;
  first?: Maybe<Scalars["Int"]>;
  before?: Maybe<Scalars["String"]>;
  last?: Maybe<Scalars["Int"]>;
};

export type TypeResistanceArgs = {
  after?: Maybe<Scalars["String"]>;
  first?: Maybe<Scalars["Int"]>;
  before?: Maybe<Scalars["String"]>;
  last?: Maybe<Scalars["Int"]>;
};

export type TypeSuper_EffectiveArgs = {
  after?: Maybe<Scalars["String"]>;
  first?: Maybe<Scalars["Int"]>;
  before?: Maybe<Scalars["String"]>;
  last?: Maybe<Scalars["Int"]>;
};

export type TypeWeaknessArgs = {
  after?: Maybe<Scalars["String"]>;
  first?: Maybe<Scalars["Int"]>;
  before?: Maybe<Scalars["String"]>;
  last?: Maybe<Scalars["Int"]>;
};

export type TypeConnection = {
  __typename?: "TypeConnection";
  pageInfo: PageInfo;
  edges?: Maybe<Array<Maybe<TypeEdge>>>;
};

export type TypeEdge = {
  __typename?: "TypeEdge";
  node?: Maybe<Type>;
  cursor: Scalars["String"];
};

export type MyQueryQueryVariables = Exact<{ [key: string]: never }>;

export type MyQueryQuery = { __typename?: "Query" } & {
  pokedex?: Maybe<
    { __typename?: "Pokedex" } & Pick<Pokedex, "id" | "created" | "name">
  >;
};

export type GetPokemonQueryVariables = Exact<{
  id: Scalars["Int"];
}>;

export type GetPokemonQuery = { __typename?: "Query" } & {
  pokemon?: Maybe<
    { __typename?: "Pokemon" } & Pick<Pokemon, "id"> & {
        abilities?: Maybe<
          { __typename?: "AbilityConnection" } & {
            edges?: Maybe<
              Array<
                Maybe<
                  { __typename?: "AbilityEdge" } & {
                    node?: Maybe<
                      { __typename?: "Ability" } & Pick<
                        Ability,
                        "name" | "description"
                      >
                    >;
                  }
                >
              >
            >;
          }
        >;
      }
  >;
};

export const MyQuery = gql`
  query myQuery {
    pokedex {
      id
      created
      name
    }
  }
`;
export const GetPokemon = gql`
  query getPokemon($id: Int!) {
    pokemon(number: $id) {
      id
      abilities {
        edges {
          node {
            name
            description
          }
        }
      }
    }
  }
`;
export const myQueryMock: ExecutionResult<MyQueryQuery> = {
  data: {
    pokedex: {
      id: "e509e6ea-9fee-442a-9962-587ce7190430",
      created: "Hello World",
      name: "Hello World",
    },
  },
};

export const getPokemonMock: ExecutionResult<GetPokemonQuery> = {
  data: {
    pokemon: {
      id: "e509e6ea-9fee-442a-9962-587ce7190430",
      abilities: {
        edges: [{ node: { name: "Hello World", description: "Hello World" } }],
      },
    },
  },
};
