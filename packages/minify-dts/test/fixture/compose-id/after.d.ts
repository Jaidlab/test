declare class AgnosticIdComposer extends IdComposer {constructor(machineIdOverride?: string, sessionIdOverride?: string)}
declare class IdComposer {
readonly machineId: number
readonly sessionId: number
private nextRandom
constructor(machineId: number, sessionId: number)
make(): bigint
makeBytes(): Uint8Array<ArrayBuffer>
makeString(): string
private roll
}
/**
* @returns a base62-encoded id with a fixed width of 15 characters
*
* The 11 raw bytes are an obfuscated representation of:
* - 16 bits of a hashed machine ID
* - 16 bits of a hashed session ID
* - 42 bits timestamp (uint42, milliseconds since Unix epoch)
* - 14 bits of randomness
*/
declare const composeId: {
(): string
bytes(): Uint8Array<ArrayBuffer>
int(): bigint
}
export declare const idComposer: AgnosticIdComposer
export {composeId as default}
