export {
	setLoglevel,
	trace,
	debug,
	warn,
	error
};


/** @type {0 | 1 | 2 | 3 | 4 | 5} */
let LOG_LEVEL = 5;

/** 
	* @param {0 | 1 | 2 | 3 | 4 | 5} level
	* @return void
	* */
const setLoglevel = level => LOG_LEVEL = level;

/**
	* @param { String } context
	* @param { any } value
	* @return void
	* */
const trace = (context, value) => {
	if (LOG_LEVEL <= 2) {
		console.trace(context, value);
	}
};

/**
	* @param { String } context
	* @param { any } value
	* @return void
	* */
const debug = (context, value) => {
	if (LOG_LEVEL <= 3) {
		console.debug(context, value);
	}
};

/**
	* @param { String } context
	* @param { any } value
	* @return void
	* */
const warn = (context, value) => {
	if (LOG_LEVEL <= 4) {
		console.warn(context, value);
	}
};

/**
	* @param { String } context
	* @param { any } value
	* @return void
	* */
const error = (context, value) => {
	if (LOG_LEVEL <= 5) {
		console.error(context, value);
	}
};

