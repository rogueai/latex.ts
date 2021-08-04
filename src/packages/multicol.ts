import {Generator} from "../generator";

export class Multicol {
  g: Generator;
  args = {};

  constructor(generator, options) {
    this.g = generator;
    this.args = {
      'multicols': ['V', 'n', 'o?', 'o?']
    };
  }

  multicols(cols, pre) {
    return [pre, this.g.create(this.g.multicols(cols))];
  }
}