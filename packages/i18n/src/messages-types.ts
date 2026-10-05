/** Recursive message tree — an interface (not a type alias) so self-reference is legal. */
export interface MessageTree {
  [key: string]: string | MessageTree;
}
