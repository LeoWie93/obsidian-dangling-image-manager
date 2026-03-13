export {
	setLoglevel,
	trace,
	debug,
	warn,
	error
};

type loglevel = 0 | 1 | 2 | 3 | 4 | 5;
let LOG_LEVEL: loglevel = 5;

const setLoglevel = (level: loglevel) => LOG_LEVEL = level;

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

