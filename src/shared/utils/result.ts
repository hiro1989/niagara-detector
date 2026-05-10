/**
 * Represents a result that can either be a success (Ok) or a failure (Err).
 * This is inspired by Rust's Result<T, E> type for better error handling.
 *
 * @template T The type of the success value
 * @template E The type of the error value
 */
export type Result<T, E> = Err<E> | Ok<T>

/**
 * Gets the type of the success/ok value from a Result type.
 */
export type TypeOfOk<T> = T extends Ok<infer U> ? U : never

/**
 * Represents a failed result containing an error.
 *
 * @template E - The type of the error value
 */
type Err<E> = {
  readonly error: E
  readonly ok: false
  readonly value?: never
}

/**
 * Represents a successful result containing a value.
 *
 * @template T - The type of the success value
 */
type Ok<T> = {
  readonly error?: never
  readonly ok: true
  readonly value: T
}

/**
 * Creates a successful Result containing the given value.
 *
 * @template T The type of the success value
 * @param value The success value
 * @returns A successful Result containing the value
 */
export const ok = <T>(value: T): Result<T, never> => ({
  ok: true,
  value,
})

/**
 * Creates a failed Result containing the given error.
 *
 * @template E The type of the error
 * @param error The error
 * @returns A failed Result containing the error
 */
export const err = <E>(error: E): Result<never, E> => ({
  error,
  ok: false,
})
