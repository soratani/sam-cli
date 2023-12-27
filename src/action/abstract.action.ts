import { Input } from "../command";

export abstract class AbstractAction {

  public abstract handle(
    inputs?: Input[],
    options?: Input[],
    extraFlags?: string[],
  ): Promise<void>;
}