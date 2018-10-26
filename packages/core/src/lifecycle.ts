// Copyright IBM Corp. 2018. All Rights Reserved.
// Node module: @loopback/core
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

/**
 * Observers to handle life cycle start/stop events
 */
export interface LifeCycleObserver {
  start(): Promise<void> | void;
  stop(): Promise<void> | void;
}

/**
 * Test if an object implements LifeCycleObserver
 * @param obj An object
 */
export function isLifeCycleObserver(obj: {
  [name: string]: unknown;
}): obj is LifeCycleObserver {
  return typeof obj.start === 'function' && typeof obj.stop === 'function';
}
