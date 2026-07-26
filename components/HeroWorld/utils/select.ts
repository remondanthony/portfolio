/**
 * Scenes tag their animatable nodes with `data-hw="<name>"`. The timeline then
 * addresses them by name only — so a scene can restructure its DOM freely as
 * long as it keeps its contract of named parts.
 */

export type Scope = HTMLElement;

/** All nodes with the given hook name, as a real array. */
export function all(scope: Scope, name: string): HTMLElement[] {
  return Array.from(scope.querySelectorAll<HTMLElement>(`[data-hw="${name}"]`));
}

/** The first node with the given hook name, or null. */
export function one(scope: Scope, name: string): HTMLElement | null {
  return scope.querySelector<HTMLElement>(`[data-hw="${name}"]`);
}

/**
 * Guard used before every tween: GSAP throws on an empty target list, and a
 * scene may legitimately render nothing on small viewports.
 */
export function present(nodes: HTMLElement[]): boolean {
  return nodes.length > 0;
}
