/** fork @link https://github.com/vasturiano/index-array-by/blob/master/src/index.js */

type KeyAccessor<T = unknown> = keyof T | ((listItem: T) => keyof T);

type ReducerFn<T = unknown> = (items: T[]) => T;

interface NestedResult<T = unknown> {
	[key: string]: NestedResult<T> | T | T[];
}

type FlatResult<T = unknown> = {
	keys: string[];
	vals: T | T[];
}[];

type Object = Record<string, unknown>;

/**
 * 根据一个或多个键访问器对数组进行索引，创建嵌套对象结构或扁平化数组表示。
 * 
 * @template T 输入列表中对象的类型
 * @param {T[]} list - 需要被索引的输入数组。默认为空数组。
 * @param {KeyAccessor<T> | KeyAccessor<T>[]} keyAccessors - 定义如何访问索引键的键访问器或键访问器数组。
 *                                                         可以是属性名或从每项中提取键的函数。
 * @param {boolean | ReducerFn<T>} multiItem - 确定如何处理重复键。如果是true，值将存储在数组中。
 *                                           如果是归约函数，则会应用该函数来组合多个值。
 *                                           如果是false，则重复键时保留最后一个值。
 * @param {boolean} flattenKeys - 如果为true，返回具有显式键值对的扁平化数组表示。
 *                              如果为false，返回嵌套对象结构。
 * @returns {NestedResult<T> | FlatResult<T>} 嵌套对象结构或键值对的扁平数组
 */
export default function indexArrayBy<T extends Object = Object>(
	list: T[] = [],
	keyAccessors: KeyAccessor<T> | KeyAccessor<T>[] = [],
	multiItem: boolean | ReducerFn<T> = true,
	flattenKeys: boolean = false,
): NestedResult<T> | FlatResult<T> {
	// 将 keyAccessors 转换为具有一致格式的数组，并附带元数据
	const keys = (
		Array.isArray(keyAccessors)
			? keyAccessors.length
				? keyAccessors
				: [undefined]
			: [keyAccessors]
	).map((key) => ({
		keyAccessor: key,
		isProp: !(key instanceof Function),
	}));

	// 通过遍历列表中的每一项来构建嵌套索引结果
	const indexedResult = list.reduce(
		(res, item) => {
			let iterObj = res;
			let itemVal = item;

			keys.forEach(({ keyAccessor, isProp }, idx) => {
				let key: keyof NestedResult<T>;
				if (isProp) {
					const { [keyAccessor as string]: propVal, ...rest } = itemVal;
					key = propVal as keyof NestedResult<T>;
					itemVal = rest as T;
				} else {
					key = (keyAccessor as (listItem: T, idx: number) => string)(
						itemVal,
						idx,
					);
				}

				if (idx + 1 < keys.length) {
					if (!Object.hasOwn(iterObj, key)) {
						iterObj[key as keyof NestedResult<T>] = {};
					}
					iterObj = iterObj[key] as NestedResult<T>;
				} else {
					// 叶子键
					if (multiItem) {
						if (!Object.hasOwn(iterObj, key)) {
							iterObj[key] = [];
						}
						(iterObj[key] as T[]).push(itemVal);
					} else {
						iterObj[key] = itemVal;
					}
				}
			});
			return res;
		},
		{} as NestedResult<T>,
	);

	// 如果 multiItem 是函数，则对每组项目应用归约函数
	if (multiItem instanceof Function) {
		// 归约叶子节点的多个值
		(function reduce(node: NestedResult<T> | T[], level = 1) {
			if (level === keys.length) {
				if (Array.isArray(node)) {
					// 根据算法这种情况不应该发生，但为了类型安全而添加
					return;
				}
				Object.keys(node).forEach((k) => {
					const currentValue = node[k];
					if (Array.isArray(currentValue)) {
						node[k] = multiItem(currentValue);
					}
				});
			} else {
				Object.values(node).forEach((child) => {
					if (typeof child === "object" && child !== null) {
						reduce(child as NestedResult<T>, level + 1);
					}
				});
			}
		})(indexedResult); // 立即执行函数
	}

	let result: NestedResult<T> | FlatResult<T> = indexedResult;

	// 如果需要，将结果转换为扁平化数组格式
	if (flattenKeys) {
		// 扁平化为数组
		result = [] as FlatResult<T>;

		(function flatten(node: NestedResult<T> | T[], accKeys: string[] = []) {
			if (accKeys.length === keys.length) {
				(result as FlatResult<T>).push({
					keys: accKeys,
					vals: node as T | T[],
				});
			} else {
				if (typeof node === "object" && node !== null && !Array.isArray(node)) {
					Object.entries(node).forEach(([key, val]) => {
						flatten(val as NestedResult<T>, [...accKeys, key]);
					});
				}
			}
		})(indexedResult); // 立即执行函数

		if (
			Array.isArray(keyAccessors) &&
			keyAccessors.length === 0 &&
			(result as FlatResult<T>).length === 1
		) {
			// 如果没有键访问器（单个结果），清除键
			(result as FlatResult<T>)[0].keys = [];
		}
	}

	return result;
}
