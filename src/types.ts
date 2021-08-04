import {Generator} from './generator';

export type TLength = typeof Length;

/**
 * This class manages lengths. A length is immutable.
 * Internally, maximum precision is used by storing absolute lengths in sp.
 *
 * We need the Length class per generator, so scope it
 * FIXME: convert to builder, e.g.:
 * ```
 * let builder = new LengthBuilder(generator);
 * let length: Length = builder.value(0).unit('sp').build();
 * ```
 *
 */
export let lengthFactory = (generator: Generator): TLength => {
  return class extends Length {
    g = generator
  };
}

export class Length {

  // TODO: test: Length = generator.Length
  g: Generator;

  public static zero = new Length(0, 'sp');
  // private
  private readonly _value: number = 0
  private readonly _unit: string = '';

  // all units in TeX sp
  unitsSp = new Map([
    ["sp", 1],
    ["pt", 65536],
    ["bp", 65536 * 72.27 / 72],        // 1 bp is the non-traditional pt
    ["pc", 65536 * 12],
    ["dd", 65536 * 1238 / 1157],
    ["cc", 65536 * 1238 / 1157 * 12],
    ["in", 65536 * 72.27],
    ["px", 65536 * 72.27 / 96],        // 1 px is 1/96 in
    ["mm", 65536 * 7227 / 2540],
    ["cm", 65536 * 7227 / 254]
  ])

  constructor(value: number, unit: string) {
    this._value = value;
    this._unit = unit;

    // if not relative/unknown unit, convert to sp
    if (this.unitsSp.has(unit)) {
      this._value = value * this.unitsSp.get(unit);
      this._unit = "sp";
    }
  }

  /**
   * Length as string (converted to px if not relative), rounded to global precision
   */
  get value() {
    if (this._unit === "sp") {
      return this.g.round(this._value / this.unitsSp.get("px")) + "px";
    } else {
      return this.g.round(this._value) + this._unit;
    }
  }

  /**
   * value in px (throw error if relative), rounded to global precision
   */
  get px() {
    if (this._unit === "sp") {
      return this.g.round(this._value / this.unitsSp.get("px"));
    } else {
      return this.g.error("Length.px() called on relative length!");
    }
  }

  get pxpct() {
    if (this._unit === "sp") {
      return this.g.round(this._value / this.unitsSp.get("px"));
    } else {
      return this.g.round(this._value) + this._unit;
    }
  }

  get unit() {
    return this._unit;
  }

  cmp(l: Length) {
    if (this._unit !== l._unit) {
      this.g.error("Length.cmp(): incompatible lengths! (" + this._unit + " and " + l._unit + ")");
    }
    if (this._value < l._value) {
      return -1;
    }
    if (this._value === l._value) {
      return 0;
    }
    return 1;
  }

  add(l: Length) {
    if (this._unit !== l._unit) {
      this.g.error("Length.add(): incompatible lengths! (" + this._unit + " and " + l._unit + ")");
    }
    return new this.g.length(this._value + l._value, this._unit);
  }

  sub(l: Length) {
    if (this._unit !== l._unit) {
      this.g.error("Length.sub: incompatible lengths! (" + this._unit + " and " + l._unit + ")");
    }
    return new this.g.length(this._value - l._value, this._unit);
  }

  mul(s) {
    return new this.g.length(this._value * s, this._unit);
  }

  div(s) {
    return new this.g.length(this._value / s, this._unit);
  }

  abs() {
    return new this.g.length(Math.abs(this._value), this._unit);
  }

  ratio(l: Length) {
    if (this._unit !== l._unit) {
      this.g.error("Length.ratio: incompatible lengths! (" + this._unit + " and " + l._unit + ")");
    }
    return this._value / l._value;
  }

  norm(l: Length) {
    if (this._unit !== l._unit) {
      this.g.error("Length.norm: incompatible lengths! (" + this._unit + " and " + l._unit + ")");
    }
    return new this.g.length(Math.sqrt(Math.pow(this._value, 2) + Math.pow(l._value, 2)), this._unit);
  }

  static min(...arg: Length[]) {
    return arg.reduce((a, b) => {
      if (a.cmp(b) < 0) {
        return a;
      } else {
        return b;
      }
    });
  }

  static max(...arg: Length[]) {
    return arg.reduce((a, b) => {
      if (a.cmp(b) > 0) {
        return a;
      } else {
        return b;
      }
    });
  }
}

export class Vector {
  private readonly _x: Length = null;
  private readonly _y: Length = null;

  constructor(x, y) {
    this._x = x;
    this._y = y;
  }

  get x() {
    return this._x;
  }

  get y() {
    return this._y;
  }

  add(v) {
    return new Vector(this._x.add(v.x), this._y.add(v.y));
  }

  sub(v) {
    return new Vector(this._x.sub(v.x), this._y.sub(v.y));
  }

  mul(s) {
    return new Vector(this._x.mul(s), this._y.mul(s));
  }

  shift_start(l) {
    var x, y, msq, imsq, dir_x, dir_y, sx, sy;
    if (this._x.unit !== this._y.unit) {
      throw new Error("Vector.shift_start: incompatible lengths! (" + this._x.unit + " and " + this._y.unit + ")");
    }
    x = this._x.value;
    y = this._y.value;
    msq = Math.sqrt(1 + y * y / (x * x));
    imsq = Math.sqrt(1 + x * x / (y * y));
    dir_x = x < 0 ? -1 : 1;
    dir_y = y < 0 ? -1 : 1;
    if (x !== 0 && y !== 0) {
      sx = l.div(msq).mul(-dir_x);
      sy = l.div(imsq).mul(-dir_y);
    } else if (y === 0) {
      sx = l.mul(-dir_x);
      sy = this._y.mul(0);
    } else {
      sx = this._x.mul(0);
      sy = l.mul(-dir_y);
    }
    return new Vector(sx, sy);
  }

  shift_end(l) {
    var x, y, msq, imsq, dir_x, dir_y, ex, ey;
    if (this._x.unit !== this._y.unit) {
      throw new Error("Vector.shift_end: incompatible lengths! (" + this._x.unit + " and " + this._y.unit + ")");
    }
    x = this._x.value;
    y = this._y.value;
    msq = Math.sqrt(1 + y * y / (x * x));
    imsq = Math.sqrt(1 + x * x / (y * y));
    dir_x = x < 0 ? -1 : 1;
    dir_y = y < 0 ? -1 : 1;
    if (x !== 0 && y !== 0) {
      ex = this._x.add(l.div(msq).mul(dir_x));
      ey = this._y.add(l.div(imsq).mul(dir_y));
    } else if (y === 0) {
      ex = this._x.add(l.mul(dir_x));
      ey = this._y;
    } else {
      ex = this._x;
      ey = this._y.add(l.mul(dir_y));
    }
    return new Vector(ex, ey);
  }

  norm() {
    return this._x.norm(this._y);
  }
}