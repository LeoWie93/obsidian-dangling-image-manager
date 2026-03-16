export {
	setLoglevel,
	trace,
	debug,
	warn,
	error
};

let LOG_LEVEL: number = 5;

const setLoglevel = (level: number) => LOG_LEVEL = level;

const trace = (context: String, value: any) => {
	if (LOG_LEVEL <= 2) {
		console.trace(context, value);
	}
};

const debug = (context: String, value: any): void => {
	if (LOG_LEVEL <= 3) {
		console.debug(context, value);
	}
};

const warn = (context: String, value: any): void => {
	if (LOG_LEVEL <= 4) {
		console.warn(context, value);
	}
};

const error = (context: String, value: any): void => {
	if (LOG_LEVEL <= 5) {
		console.error(context, value);
	}
};

