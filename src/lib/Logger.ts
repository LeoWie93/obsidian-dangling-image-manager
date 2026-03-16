export {
	setLoglevel,
	debug,
	warn,
	error
};

let LOG_LEVEL: number = 4;

const setLoglevel = (level: number) => LOG_LEVEL = level;

const debug = (context: string, value: object): void => {
	if (LOG_LEVEL <= 2) {
		console.debug(context, value);
	}
};

const warn = (context: string, value: object): void => {
	if (LOG_LEVEL <= 3) {
		console.warn(context, value);
	}
};

const error = (context: string, value: object): void => {
	if (LOG_LEVEL <= 4) {
		console.error(context, value);
	}
};

