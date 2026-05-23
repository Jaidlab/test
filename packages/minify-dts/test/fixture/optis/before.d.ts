declare class ProcessedOptionsMapRuntime<OptionsGeneric extends Record<string, unknown> = Record<string, unknown>> implements ProcessedOptionsMapShape<OptionsGeneric> {
	readonly map: Map<KeyOf<OptionsGeneric>, OptionsGeneric[KeyOf<OptionsGeneric>]>;
	constructor(options?: OptionsGeneric);
	get size(): number;
	entries(): MapIterator<[
		Extract<keyof OptionsGeneric, string>,
		OptionsGeneric[Extract<keyof OptionsGeneric, string>]
	]>;
	forEach(callbackfn: (value: OptionsGeneric[KeyOf<OptionsGeneric>], key: KeyOf<OptionsGeneric>, map: this) => void, thisArg?: unknown): void;
	get<KeyGeneric extends KeyOf<OptionsGeneric>>(key: KeyGeneric): OptionsGeneric[KeyGeneric];
	has<KeyGeneric extends KeyOf<OptionsGeneric>>(key: KeyGeneric): this is ProcessedOptionsMapShape<OptionsGeneric & {
		[Key in KeyGeneric]-?: Exclude<OptionsGeneric[Key], undefined>;
	}>;
	keys(): MapIterator<Extract<keyof OptionsGeneric, string>>;
	[Symbol.iterator](): MapIterator<[
		Extract<keyof OptionsGeneric, string>,
		OptionsGeneric[Extract<keyof OptionsGeneric, string>]
	]>;
	values(): MapIterator<OptionsGeneric[Extract<keyof OptionsGeneric, string>]>;
}
declare const schemaBrandSymbol: unique symbol;
export declare class RequiredOptionsError extends Error {
	static getMessage(missingKeys: ReadonlyArray<string>): string;
	readonly givenKeys: Array<string>;
	readonly missingKeys: Array<string>;
	readonly requiredKeys: Array<string>;
	constructor(givenKeys: ReadonlyArray<string>, requiredKeys: KeyList$1);
}
export declare const ProcessedOptionsMap: typeof ProcessedOptionsMapRuntime;
export declare function optis(): Schema;
export declare function optis<InputGeneric extends Dict$1>(input: InputGeneric): Schema<ToSetupFromInput<InputGeneric>>;
export declare namespace optis {
	type Dict<ValueGeneric = unknown> = Dict$1<ValueGeneric>;
	type Setup = Setup;
	type Schema<SetupGeneric extends Setup = {}> = Schema<SetupGeneric>;
	type Parameter<InputGeneric> = Parameter<InputGeneric>;
	type Processed<InputGeneric> = Processed<InputGeneric>;
	type ProcessedMap<InputGeneric> = ProcessedMap<InputGeneric>;
	const typed: TypedFactory;
	const ProcessedOptionsMap: {
		new <OptionsGeneric extends Record<string, unknown> = Record<string, unknown>>(options?: OptionsGeneric): {
			readonly map: Map<Extract<keyof OptionsGeneric, string>, OptionsGeneric[Extract<keyof OptionsGeneric, string>]>;
			get size(): number;
			entries(): MapIterator<[
				Extract<keyof OptionsGeneric, string>,
				OptionsGeneric[Extract<keyof OptionsGeneric, string>]
			]>;
			forEach(callbackfn: (value: OptionsGeneric[Extract<keyof OptionsGeneric, string>], key: Extract<keyof OptionsGeneric, string>, map: any) => void, thisArg?: unknown): void;
			get<KeyGeneric extends Extract<keyof OptionsGeneric, string>>(key: KeyGeneric): OptionsGeneric[KeyGeneric];
			has<KeyGeneric extends Extract<keyof OptionsGeneric, string>>(key: KeyGeneric): this is ProcessedOptionsMapShape<OptionsGeneric & {
				[Key in KeyGeneric]-?: Exclude<OptionsGeneric[Key], undefined>;
			}>;
			keys(): MapIterator<Extract<keyof OptionsGeneric, string>>;
			values(): MapIterator<OptionsGeneric[Extract<keyof OptionsGeneric, string>]>;
			[Symbol.iterator](): MapIterator<[
				Extract<keyof OptionsGeneric, string>,
				OptionsGeneric[Extract<keyof OptionsGeneric, string>]
			]>;
		};
	};
	const RequiredOptionsError: typeof RequiredOptionsError;
}
export interface Schema<SetupGeneric extends Setup = {}> extends SchemaMethods {
	extendTyped: <AddedSetupGeneric extends Setup = {}>() => Schema<MergeSetup<SetupGeneric, AddedSetupGeneric>>;
	readonly [schemaBrandSymbol]: NormalizeSetup<SetupGeneric>;
}
export interface TypedFactory extends SchemaMethods {
	<SetupGeneric extends Setup = {}>(): Schema<SetupGeneric>;
}
export type Parameter<InputGeneric> = ExtractSetup<InputGeneric> extends infer SetupGeneric extends Setup ? ParameterFromSetup<SetupGeneric> : never;
export type Processed<InputGeneric> = ExtractSetup<InputGeneric> extends infer SetupGeneric extends Setup ? ProcessedFromSetup<SetupGeneric> : never;
export type ProcessedMap<InputGeneric> = ProcessedOptionsMapShape<Processed<InputGeneric>>;
export type ProcessedOptionsMap<OptionsGeneric extends Record<string, unknown> = Record<string, unknown>> = ProcessedOptionsMapShape<OptionsGeneric>;
export type Setup = {
	defaults?: Dict$1;
	normalizations?: Dict$1;
	optional?: Dict$1;
	optionalKeys?: KeyList;
	required?: Dict$1;
	requiredKeys?: KeyList;
};
interface ProcessedOptionsMapShape<OptionsGeneric extends Record<string, unknown> = Record<string, unknown>> {
	get: <KeyGeneric extends KeyOf<OptionsGeneric>>(key: KeyGeneric) => OptionsGeneric[KeyGeneric];
	has: <KeyGeneric extends KeyOf<OptionsGeneric>>(key: KeyGeneric) => this is ProcessedOptionsMapShape<OptionsGeneric & {
		[Key in KeyGeneric]-?: Exclude<OptionsGeneric[Key], undefined>;
	}>;
	readonly size: number;
}
interface SchemaMethods {
	check: <ThisGeneric>(this: ThisGeneric, options?: Parameter<ThisGeneric>) => void;
	extend: <ThisGeneric, InputGeneric extends Dict$1 | undefined = undefined>(this: ThisGeneric, input?: InputGeneric) => Schema<MergeSetup<ExtractSetup<ThisGeneric>, ToSetupFromInput<InputGeneric>>>;
	process: <ThisGeneric>(this: ThisGeneric, options?: Parameter<ThisGeneric>) => Processed<ThisGeneric>;
	processMap: <ThisGeneric>(this: ThisGeneric, options?: Parameter<ThisGeneric>) => ProcessedMap<ThisGeneric>;
}
type DefaultsOf<SetupGeneric extends Setup> = SetupGeneric extends {
	defaults: infer DefaultsGeneric extends Dict$1;
} ? DefaultsGeneric : {};
type Dict$1<ValueGeneric = unknown> = Record<string, ValueGeneric>;
type ExtractSetup<InputGeneric> = InputGeneric extends {
	readonly [schemaBrandSymbol]: infer SetupGeneric extends Setup;
} ? SetupGeneric : InputGeneric extends (...args: any) => infer ReturnGeneric ? ExtractSetup<ReturnGeneric> : InputGeneric extends Setup ? NormalizeSetup<InputGeneric> : never;
type HasSetupKey<InputGeneric extends Dict$1> = string extends keyof InputGeneric ? false : Extract<keyof InputGeneric, SetupKey> extends never ? false : true;
type IsEmptyRecord<InputGeneric extends Dict$1> = [
	keyof InputGeneric
] extends [
	never
] ? true : false;
type KeyList = ReadonlyArray<string> | string;
type KeyList$1 = ReadonlyArray<string> | string;
type KeyOf<OptionsGeneric extends Record<string, unknown>> = Extract<keyof OptionsGeneric, string>;
type KeysToRecord<InputGeneric> = [
	InputGeneric
] extends [
	never
] ? {} : Record<Extract<InputGeneric, string>, unknown>;
type KeysToUnion<InputGeneric> = InputGeneric extends ReadonlyArray<string> ? InputGeneric[number] : InputGeneric extends string ? InputGeneric : never;
type Merge<LowPriorityGeneric extends Dict$1, HighPriorityGeneric extends Dict$1> = Simplify<Omit<LowPriorityGeneric, keyof HighPriorityGeneric> & HighPriorityGeneric>;
type MergeSetup<BaseSetupGeneric extends Setup, ExtensionSetupGeneric extends Setup> = Simplify<{
	defaults: Merge<DefaultsOf<NormalizeSetup<BaseSetupGeneric>>, DefaultsOf<NormalizeSetup<ExtensionSetupGeneric>>>;
	normalizations: Merge<NormalizationsOf<NormalizeSetup<BaseSetupGeneric>>, NormalizationsOf<NormalizeSetup<ExtensionSetupGeneric>>>;
	optional: Merge<OptionalOf<NormalizeSetup<BaseSetupGeneric>>, OptionalOf<NormalizeSetup<ExtensionSetupGeneric>>>;
	required: Merge<RequiredOf<NormalizeSetup<BaseSetupGeneric>>, RequiredOf<NormalizeSetup<ExtensionSetupGeneric>>>;
}>;
type NormalizationsOf<SetupGeneric extends Setup> = SetupGeneric extends {
	normalizations: infer NormalizationsGeneric extends Dict$1;
} ? NormalizationsGeneric : {};
type NormalizeSetup<SetupGeneric extends Setup> = Simplify<{
	defaults: DefaultsOf<SetupGeneric>;
	normalizations: NormalizationsOf<SetupGeneric>;
	optional: OptionalDeclaredOf<SetupGeneric>;
	required: RequiredDeclaredOf<SetupGeneric>;
}>;
type NormalizerReturnTypes<InputGeneric> = InputGeneric extends Record<string, (...args: any) => any> ? {
	[Key in keyof InputGeneric]: ReturnType<InputGeneric[Key]>;
} : {};
type OptionalDeclaredOf<SetupGeneric extends Setup> = Merge<KeysToRecord<KeysToUnion<OptionalKeysOf<SetupGeneric>>>, OptionalOf<SetupGeneric>>;
type OptionalInputOf<SetupGeneric extends Setup> = Omit<OptionalDeclaredOf<SetupGeneric>, keyof RequiredInputOf<SetupGeneric>>;
type OptionalKeysOf<SetupGeneric extends Setup> = SetupGeneric extends {
	optionalKeys: infer KeysGeneric extends KeyList;
} ? KeysGeneric : never;
type OptionalOf<SetupGeneric extends Setup> = SetupGeneric extends {
	optional: infer OptionalGeneric extends Dict$1;
} ? OptionalGeneric : {};
type OptionalOutputOf<SetupGeneric extends Setup> = Omit<OptionalDeclaredOf<SetupGeneric>, keyof DefaultsOf<SetupGeneric> | keyof RequiredDeclaredOf<SetupGeneric>>;
type ParameterFromSetup<SetupGeneric extends Setup> = IsEmptyRecord<RequiredInputOf<NormalizeSetup<SetupGeneric>>> extends true ? ParameterObjectOf<NormalizeSetup<SetupGeneric>> | undefined : ParameterObjectOf<NormalizeSetup<SetupGeneric>>;
type ParameterObjectOf<SetupGeneric extends Setup> = Simplify<Partial<DefaultsOf<SetupGeneric>> & Partial<OptionalInputOf<SetupGeneric>> & RequiredInputOf<SetupGeneric>>;
type ProcessedFromSetup<SetupGeneric extends Setup> = ProcessedObjectOf<NormalizeSetup<SetupGeneric>>;
type ProcessedObjectOf<SetupGeneric extends Setup> = ReplaceValues<Simplify<DefaultsOf<SetupGeneric> & RequiredDeclaredOf<SetupGeneric> & Partial<OptionalOutputOf<SetupGeneric>>>, NormalizationsOf<SetupGeneric>>;
type ReplaceValues<InputGeneric extends Dict$1, ReplacementGeneric extends Dict$1> = Simplify<{
	[Key in keyof InputGeneric]: Key extends keyof ReplacementGeneric ? ReplacementGeneric[Key] : InputGeneric[Key];
}>;
type RequiredDeclaredOf<SetupGeneric extends Setup> = Merge<KeysToRecord<KeysToUnion<RequiredKeysOf<SetupGeneric>>>, RequiredOf<SetupGeneric>>;
type RequiredInputOf<SetupGeneric extends Setup> = Omit<RequiredDeclaredOf<SetupGeneric>, keyof DefaultsOf<SetupGeneric>>;
type RequiredKeysOf<SetupGeneric extends Setup> = SetupGeneric extends {
	requiredKeys: infer KeysGeneric extends KeyList;
} ? KeysGeneric : never;
type RequiredOf<SetupGeneric extends Setup> = SetupGeneric extends {
	required: infer RequiredGeneric extends Dict$1;
} ? RequiredGeneric : {};
type SetupKey = "defaults" | "normalizations" | "optional" | "optionalKeys" | "required" | "requiredKeys";
type Simplify<InputGeneric> = {
	[Key in keyof InputGeneric]: InputGeneric[Key];
} & {};
type ToSetupFromInput<InputGeneric> = [
	InputGeneric
] extends [
	undefined
] ? {} : InputGeneric extends Dict$1 ? HasSetupKey<InputGeneric> extends true ? NormalizeSetup<{
	defaults: InputGeneric extends {
		defaults: infer DefaultsGeneric extends Dict$1;
	} ? DefaultsGeneric : {};
	normalizations: InputGeneric extends {
		normalizations: infer NormalizationsGeneric;
	} ? NormalizerReturnTypes<NormalizationsGeneric> : {};
	optional: InputGeneric extends {
		optional: infer OptionalGeneric extends Dict$1;
	} ? OptionalGeneric : {};
	optionalKeys: InputGeneric extends {
		optionalKeys: infer KeysGeneric extends KeyList;
	} ? KeysGeneric : never;
	required: InputGeneric extends {
		required: infer RequiredGeneric extends Dict$1;
	} ? RequiredGeneric : {};
	requiredKeys: InputGeneric extends {
		requiredKeys: infer KeysGeneric extends KeyList;
	} ? KeysGeneric : never;
}> : {
	defaults: InputGeneric;
} : {};

export {
	Dict$1 as Dict,
	Dict$1 as OptisDict,
	Parameter as OptisParameter,
	Processed as OptisProcessed,
	ProcessedMap as OptisProcessedMap,
	Schema as OptisSchema,
	Setup as OptisSetup,
	TypedFactory as OptisTypedFactory,
	optis as default,
};

export {};
