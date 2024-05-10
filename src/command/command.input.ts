export interface Input<V = any> {
  name: string;
  value: boolean | string | V;
  options?: any;
}
