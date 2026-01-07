import { Task } from "./Tasks";
import * as logger from "../Logger";

//TODO rewrite to use objects and not classes
export class SyncTaskQueue {
	queue: Task[] = [];
	locked: boolean = false;
	//TODO deadletter queue?

	enqueue(task: Task): void {
		this.queue.push(task);
		this.dequeue();
	}

	async dequeue(): Promise<void> {
		if (this.locked) {
			return;
		}

		if (this.queue.length === 0) {
			return;
		}

		this.locked = true;

		const task: Task | undefined = this.queue.shift();

		try {
			await task?.execute();
		} catch (e) {
			if (e instanceof Error) {
				logger.error("Task failed with error", e.message);
			} else {
				logger.error("Task failed", e);
			}
		}

		this.locked = false;
		this.dequeue();
	}
}

