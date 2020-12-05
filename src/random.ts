export type RandomFn = () => number

export type Random = {
  (): number
  int: (min: number, max: number) => number
  float: (min: number, max: number, toFixed?: number) => number
  bool: () => boolean
}

export function randomFactory(randomFn: RandomFn): Random {
  function random() {
    return randomFn()
  }

  random.int = (min: number, max: number) => {
    return Math.floor(randomFn() * (max - min + 1) + min)
  }

  random.float = (min: number, max: number, toFixed?: number) => {
    const result = randomFn() * (max - min) + min
    if (toFixed != null) {
      return Number(result.toFixed(toFixed))
    }
    return result
  }

  random.bool = () => {
    return randomFn() >= 0.5
  }

  return random
}
